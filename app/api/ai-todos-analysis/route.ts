/**
 * AI 할 일 분석 API 라우트
 * 사용자의 할 일 목록을 다각도로 분석해 요약, 인사이트, 추천 사항을 생성합니다.
 */
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
import { NextRequest, NextResponse } from 'next/server';
import type { AiAnalysisResult } from '@/types/todo';

interface TodoItem {
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'high' | 'medium' | 'low';
  category: string[];
  completed: boolean;
}

const PRIORITY_LABEL: Record<string, string> = { high: '높음', medium: '보통', low: '낮음' };
const DOW_KR = ['일', '월', '화', '수', '목', '금', '토'];

// ── 통계 계산 ────────────────────────────────────────────────────

/**
 * 프롬프트에 주입할 풍부한 통계 데이터를 사전 계산합니다.
 * AI가 근거 없이 추론하지 않도록 정확한 수치를 전달합니다.
 */
const computeStats = (todos: TodoItem[], todayStr: string, kstNow: Date) => {
  const total = todos.length;
  const completedItems = todos.filter((t) => t.completed);
  const incompleteItems = todos.filter((t) => !t.completed);
  const completed = completedItems.length;
  const incomplete = incompleteItems.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 우선순위별 완료 현황
  const byPriority = {
    high: { total: 0, completed: 0 },
    medium: { total: 0, completed: 0 },
    low: { total: 0, completed: 0 },
  } as Record<'high' | 'medium' | 'low', { total: number; completed: number }>;
  todos.forEach((t) => {
    byPriority[t.priority].total++;
    if (t.completed) byPriority[t.priority].completed++;
  });
  const priorityRate = (p: 'high' | 'medium' | 'low') =>
    byPriority[p].total > 0
      ? Math.round((byPriority[p].completed / byPriority[p].total) * 100)
      : 0;

  // 기한 초과 (미완료 + 마감일이 오늘 이전)
  const overdueItems = incompleteItems.filter(
    (t) => t.due_date && t.due_date.slice(0, 10) < todayStr
  );
  const overdueCount = overdueItems.length;

  // 마감일 준수율
  const itemsWithDueDate = todos.filter((t) => t.due_date);
  const deadlineAdherenceRate =
    itemsWithDueDate.length > 0
      ? Math.round(
          (itemsWithDueDate.filter((t) => t.completed).length / itemsWithDueDate.length) * 100
        )
      : null;

  // 카테고리 분포
  const categoryMap: Record<string, number> = {};
  todos.forEach((t) =>
    t.category.forEach((c) => {
      categoryMap[c] = (categoryMap[c] ?? 0) + 1;
    })
  );
  const categoryStats =
    Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .map(([c, n]) => `${c}(${n}개)`)
      .join(', ') || '미분류';

  // 요일별 분포 (이번 주 분석 전용)
  const dowMap: Record<string, { total: number; completed: number }> = {};
  todos.forEach((t) => {
    if (!t.due_date) return;
    const dow = DOW_KR[new Date(t.due_date).getUTCDay()];
    if (!dowMap[dow]) dowMap[dow] = { total: 0, completed: 0 };
    dowMap[dow].total++;
    if (t.completed) dowMap[dow].completed++;
  });
  const dowStats = Object.entries(dowMap)
    .map(([dow, s]) => `${dow}요일: ${s.total}개(완료 ${s.completed}개)`)
    .join(' | ');

  // 현재 시각 컨텍스트
  const currentHour = kstNow.getUTCHours();
  const currentMin = kstNow.getUTCMinutes();
  const remainingHours = Math.max(0, 23 - currentHour);
  const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

  return {
    total,
    completed,
    incomplete,
    completionRate,
    byPriority,
    priorityRate,
    overdueCount,
    overdueItems,
    deadlineAdherenceRate,
    categoryStats,
    dowStats,
    currentHour,
    remainingHours,
    timeStr,
    itemsWithDueDateCount: itemsWithDueDate.length,
  };
};

// ── 프롬프트 생성 ────────────────────────────────────────────────

const buildPrompt = (
  todos: TodoItem[],
  period: 'today' | 'week',
  todayStr: string,
  kstNow: Date
): string => {
  const isToday = period === 'today';
  const periodLabel = isToday ? '오늘' : '이번 주';
  const s = computeStats(todos, todayStr, kstNow);

  // 상세 할 일 목록 (기한 초과 태그 포함)
  const todoListText = todos
    .map((t, i) => {
      const status = t.completed ? '✅ 완료' : '⬜ 미완료';
      const isOverdue = !t.completed && !!t.due_date && t.due_date.slice(0, 10) < todayStr;
      const overdueTag = isOverdue ? ' ⚠️기한초과' : '';
      const priority = PRIORITY_LABEL[t.priority] ?? '보통';
      const dueDate = t.due_date ? `마감: ${t.due_date.slice(0, 10)}` : '마감일 없음';
      const categories = t.category.length > 0 ? ` | 카테고리: ${t.category.join(', ')}` : '';
      const desc = t.description ? `\n   설명: ${t.description}` : '';
      return `${i + 1}. [${status}${overdueTag}] ${t.title} | 우선순위: ${priority} | ${dueDate}${categories}${desc}`;
    })
    .join('\n');

  const priorityBlock = `
  • 높음: 전체 ${s.byPriority.high.total}개 → 완료 ${s.byPriority.high.completed}개 (완료율 ${s.priorityRate('high')}%)
  • 보통: 전체 ${s.byPriority.medium.total}개 → 완료 ${s.byPriority.medium.completed}개 (완료율 ${s.priorityRate('medium')}%)
  • 낮음: 전체 ${s.byPriority.low.total}개 → 완료 ${s.byPriority.low.completed}개 (완료율 ${s.priorityRate('low')}%)`.trim();

  const timeMgmtBlock = isToday
    ? `
=== ⏰ 시간 관리 컨텍스트 (오늘 전용) ===
• 현재 시각 (KST): ${s.timeStr}
• 오늘 남은 시간: 약 ${s.remainingHours}시간
• 미완료 할 일: ${s.incomplete}개 (기한 초과 ${s.overdueCount}개 포함)
• 지금 이 시간에 처리 가능한 부하 평가 필요`
    : `
=== 📅 요일별 분포 (이번 주 전용) ===
${s.dowStats || '마감일이 설정된 할 일이 없습니다'}`;

  const todaySummaryGuide = isToday
    ? `- 현재 시각(${s.timeStr}) 기준 남은 시간(${s.remainingHours}시간)과 미완료 할 일(${s.incomplete}개)을 연결해 오늘 집중해야 할 것을 제안`
    : `- 이번 주 완료율(${s.completionRate}%)과 요일별 분포를 바탕으로 주간 흐름을 평가하고 다음 주 계획 방향 제시`;

  const insightGuide = isToday
    ? `  ③ 시간대 집중도: 현재 ${s.timeStr} 기준, 남은 ${s.remainingHours}시간 동안 ${s.incomplete}개 처리 가능성 평가
  ④ 업무 유형 패턴: 어떤 카테고리(${s.categoryStats}) 항목이 잘 완료되거나 자주 미뤄지는지 분석
  ⑤ 당일 업무 부하: 미완료 항목의 우선순위 구성을 바탕으로 남은 하루의 난이도 평가`
    : `  ③ 요일별 패턴: 어느 요일에 할 일이 집중되는지, 생산적인 요일이 언제인지 분석
  ④ 업무 유형 패턴: 카테고리(${s.categoryStats}) 기준으로 잘 완료되는 유형과 미루는 유형 식별
  ⑤ 주간 업무 분산도: 특정 날짜에 업무가 편중되어 있는지, 과부하 요일 존재 여부 파악`;

  const recommendGuide = isToday
    ? `  ① 즉시 행동: 기한 초과(${s.overdueCount}개)와 우선순위 높음(${s.byPriority.high.total - s.byPriority.high.completed}개 미완료) 항목을 먼저 처리하는 구체적 순서 제안
  ② 시간 활용: 남은 ${s.remainingHours}시간을 최대한 활용하는 시간 블록 전략 (예: "지금 바로 ~부터 시작해 보세요")
  ③ 과부하 방지: 오늘 하루 처리하기 어려운 항목은 내일로 분산하거나 우선순위를 재조정
  ④ 긍정 강화: 완료한 ${s.completed}개 항목에 대한 구체적인 칭찬과 완료율(${s.completionRate}%)에 대한 평가
  ⑤ 내일 준비: 오늘 못 한 것들을 내일 어떻게 처리할지 간단한 제안`
    : `  ① 이번 주 마무리: 남은 미완료 ${s.incomplete}개 중 이번 주 안에 꼭 처리해야 할 항목과 다음 주로 미뤄도 되는 항목 구분
  ② 다음 주 계획: 이번 주 패턴을 바탕으로 다음 주 할 일을 균형 있게 분산하는 방법 제안
  ③ 반복 패턴 개선: 자주 미뤄지는 유형이 있다면 원인과 해결책 제시
  ④ 긍정 강화: 이번 주 잘 완료한 카테고리나 우선순위 항목에 대한 구체적 칭찬
  ⑤ 마감일 관리: 기한 초과(${s.overdueCount}개)를 줄이기 위한 실용적인 마감일 설정/관리 습관 제안`;

  return `당신은 사용자의 생산성과 시간 관리를 돕는 친근하고 전문적인 AI 코치입니다.
아래 데이터를 철저히 분석하고, 반드시 순수 JSON만 출력하세요.
마크다운 코드블록(\`\`\`)이나 다른 텍스트는 절대 포함하지 마세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 분석 기준 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• 오늘 날짜 (KST): ${todayStr}
• 분석 기간: ${periodLabel}
${timeMgmtBlock}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ${periodLabel} 종합 통계
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 전체 현황
  • 전체: ${s.total}개 | 완료: ${s.completed}개 | 미완료: ${s.incomplete}개
  • 전체 완료율: ${s.completionRate}%
  • 기한 초과(미완료): ${s.overdueCount}개
  ${s.deadlineAdherenceRate !== null ? `• 마감일 준수율: ${s.deadlineAdherenceRate}% (마감일 있는 ${s.itemsWithDueDateCount}개 기준)` : '• 마감일이 설정된 항목 없음'}

■ 우선순위별 완료 현황
  ${priorityBlock}

■ 카테고리 분포
  ${s.categoryStats}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ${periodLabel} 할 일 목록 (전체)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${todoListText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 분석 작성 지침
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【summary】 2~3문장의 따뜻하고 구체적인 종합 요약
- 완료율(${s.completionRate}%)과 완료 수(${s.completed}/${s.total})를 정확한 숫자로 언급
- 잘하고 있는 점을 먼저 칭찬하고, 남은 과제를 부드럽게 언급
${todaySummaryGuide}
- 끝에 짧은 동기부여 문장 포함

【urgentTasks】 즉시 처리 필요한 미완료 항목 최대 3개 (문자열 배열)
- 선택 기준: ① 기한 초과, ② 우선순위 높음, ③ 마감 임박 순서
- 해당 없으면 빈 배열 []

【insights】 데이터 기반 패턴 분석 4~5개 (문자열 배열)
위 통계를 근거로 다음을 분석하세요:
  ① 완료율 평가: 우선순위별 완료 패턴 — 어떤 우선순위 항목을 잘/못 처리하는지 구체적으로
  ② 마감일 관리: 기한 초과 ${s.overdueCount}개의 의미, 마감일 준수 패턴의 특징
${insightGuide}
- 구체적인 숫자를 반드시 포함하고, 자연스럽고 이해하기 쉬운 한국어 문장으로 작성

【recommendations】 즉시 실천 가능한 맞춤 추천 4~5개 (문자열 배열)
${recommendGuide}
- 딱딱한 명령형이 아닌 "~해보는 건 어떨까요?", "~부터 시작해 보세요!" 같은 친근한 코칭 문체
- 각 항목은 독립적으로 읽어도 의미가 전달되도록 자기완결적으로 작성

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 출력 형식 (이 JSON만 출력)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "summary": "string",
  "urgentTasks": ["string"],
  "insights": ["string"],
  "recommendations": ["string"]
}`;
};

// ── 메인 핸들러 ──────────────────────────────────────────────────

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { todos, period } = body as { todos: TodoItem[]; period: 'today' | 'week' };

    if (!todos || !Array.isArray(todos)) {
      return NextResponse.json({ error: '할 일 목록이 필요합니다.' }, { status: 400 });
    }

    if (!['today', 'week'].includes(period)) {
      return NextResponse.json(
        { error: '분석 기간은 today 또는 week이어야 합니다.' },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'AI 서비스가 설정되지 않았습니다. 관리자에게 문의해 주세요.' },
        { status: 503 }
      );
    }

    // KST 기준 현재 시각
    const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const todayStr = kstNow.toISOString().slice(0, 10);

    // 할 일이 없을 때 빈 응답 (AI 호출 없이 즉시 반환)
    if (todos.length === 0) {
      const periodLabel = period === 'today' ? '오늘' : '이번 주';
      return NextResponse.json({
        summary: `${periodLabel}은 아직 등록된 할 일이 없네요. 새로운 할 일을 추가해 보세요! 😊`,
        urgentTasks: [],
        insights: [`${periodLabel} 마감인 할 일이 없어 패턴을 분석할 수 없습니다.`],
        recommendations: [
          '마감일을 설정해 새 할 일을 등록하면 AI가 맞춤 분석을 제공해드려요.',
          '미리 계획을 세우면 더욱 효율적으로 업무를 처리할 수 있습니다.',
        ],
      } satisfies AiAnalysisResult);
    }

    const prompt = buildPrompt(todos, period, todayStr, kstNow);

    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
    });

    // 순수 JSON 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[AI 분석] JSON 추출 실패. 원본 응답:', text);
      return NextResponse.json(
        { error: 'AI 응답을 해석할 수 없습니다. 다시 시도해 주세요.' },
        { status: 500 }
      );
    }

    let result: AiAnalysisResult;
    try {
      result = JSON.parse(jsonMatch[0]) as AiAnalysisResult;
    } catch (parseErr) {
      console.error('[AI 분석] JSON 파싱 오류:', parseErr);
      return NextResponse.json(
        { error: 'AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.' },
        { status: 500 }
      );
    }

    // 필드 기본값 보정
    const sanitized: AiAnalysisResult = {
      summary: typeof result.summary === 'string' ? result.summary : '',
      urgentTasks: Array.isArray(result.urgentTasks) ? result.urgentTasks : [],
      insights: Array.isArray(result.insights) ? result.insights : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
    };

    return NextResponse.json(sanitized);
  } catch (err) {
    console.error('AI 할 일 분석 실패:', err);
    return NextResponse.json(
      { error: 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
};

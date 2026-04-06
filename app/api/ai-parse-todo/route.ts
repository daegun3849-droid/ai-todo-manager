/**
 * AI 할 일 파싱 API 라우트
 * 자연어 텍스트를 구조화된 할 일 데이터로 변환합니다.
 *
 * 처리 단계: 전처리 → 입력 검증 → AI 호출 → 후처리 → 응답
 */
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
import { NextRequest, NextResponse } from 'next/server';

// ── 상수 ──────────────────────────────────────────────────────────
const INPUT_MIN_LENGTH  = 2;
const INPUT_MAX_LENGTH  = 500;
const TITLE_MIN_LENGTH  = 2;
const TITLE_MAX_LENGTH  = 50;
const VALID_PRIORITIES  = ['high', 'medium', 'low'] as const;

type Priority = (typeof VALID_PRIORITIES)[number];

interface ParsedTodo {
  title: string;
  due_date: string | null;
  start_time: string | null;
  due_time: string;
  priority: Priority;
  category: string[];
  past_date_warning?: boolean;
}

// ── 1. 전처리 ─────────────────────────────────────────────────────
/**
 * 입력 텍스트를 정규화합니다.
 * - 앞뒤 공백 제거
 * - 제어 문자(불가시 문자) 제거
 * - 연속된 공백을 단일 공백으로 통합
 * - 영문 소문자 정규화 (AI 일관성 향상)
 */
const normalizeInput = (raw: string): string =>
  raw
    .trim()
    .replace(/\p{C}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

// ── 2. 입력 검증 ──────────────────────────────────────────────────
interface ValidationError {
  message: string;
  status: 400;
}

/**
 * 전처리된 텍스트의 유효성을 검사합니다.
 * 문제 없으면 null, 문제 있으면 ValidationError 반환.
 */
const validateInput = (text: string): ValidationError | null => {
  if (!text) {
    return { message: '할 일 내용을 입력해 주세요.', status: 400 };
  }

  if (text.length < INPUT_MIN_LENGTH) {
    return {
      message: `최소 ${INPUT_MIN_LENGTH}자 이상 입력해 주세요. (현재 ${text.length}자)`,
      status: 400,
    };
  }

  if (text.length > INPUT_MAX_LENGTH) {
    return {
      message: `입력 내용은 ${INPUT_MAX_LENGTH}자 이내로 작성해 주세요. (현재 ${text.length}자)`,
      status: 400,
    };
  }

  // 숫자·특수문자·기호만으로 구성된 의미 없는 입력 차단
  if (/^[\s\d!@#$%^&*()\-_=+\[\]{};:'",.<>/?`~|\\]+$/.test(text)) {
    return {
      message: '알아볼 수 없는 입력입니다. 할 일 내용을 구체적으로 입력해 주세요.',
      status: 400,
    };
  }

  return null;
};

// ── 3. 프롬프트 생성 ──────────────────────────────────────────────
const buildPrompt = (text: string): { prompt: string; todayStr: string } => {
  const now    = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const addDays = (base: Date, days: number): string =>
    new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const todayStr     = kstNow.toISOString().slice(0, 10);
  const tomorrowStr  = addDays(kstNow, 1);
  const dayAfterStr  = addDays(kstNow, 2);

  const todayDow      = kstNow.getUTCDay(); // 0=일 1=월 ... 5=금 6=토
  const daysToFriday  = todayDow === 5 ? 0 : (5 - todayDow + 7) % 7;
  const thisFridayStr = addDays(kstNow, daysToFriday);

  const daysToNextMon = ((8 - todayDow) % 7) || 7;
  const nextMondayStr = addDays(kstNow, daysToNextMon);

  const prompt = `당신은 한국어 할 일 텍스트를 분석해 구조화된 JSON 데이터로 변환하는 전문 AI입니다.
반드시 순수 JSON만 출력하세요. 설명, 마크다운 코드블록, 기타 텍스트는 절대 포함하지 마세요.

=== 현재 기준 날짜 (KST) ===
오늘           : ${todayStr}
내일           : ${tomorrowStr}
모레           : ${dayAfterStr}
이번 주 금요일 : ${thisFridayStr}
다음 주 월요일 : ${nextMondayStr}

=== 날짜 처리 규칙 ===
- "오늘" → ${todayStr}
- "내일" → ${tomorrowStr}
- "모레" → ${dayAfterStr}
- "이번 주 금요일" → ${thisFridayStr}
- "다음 주 월요일" → ${nextMondayStr}
- "다음 주" 기타 요일: 위 다음 주 월요일 기준으로 해당 요일 날짜 계산
- "다음 달" / 특정 날짜(예: 3월 10일): 맥락에 맞게 YYYY-MM-DD로 변환
- 날짜 언급 없음 → null

=== 시간 처리 규칙 ===
- 시작 시간(start_time)과 마감 시간(due_time)을 분리해 추출하세요.
- 시간이 하나만 언급된 경우 → start_time: null, due_time: 해당 시간
- 두 시간이 언급된 경우("출근·시작·부터" → start_time, "퇴근·마감·까지" → due_time)
- "A시부터 B시까지", "A시 ~ B시", "오전 A시 … 오후 B시" 패턴 인식
- "아침" → "09:00" / "점심·낮" → "12:00" / "오후(미지정)" → "14:00"
- "저녁" → "18:00" / "밤·야간" → "21:00"
- "오전 N시" → 24시간제 "0N:00" / "오후 N시" → N+12 (예: 오후 2시 → "14:00")
- 시간 언급 없음 → start_time: null, due_time: "09:00"

=== 우선순위 키워드 ===
- high  : "급하게", "중요한", "빨리", "꼭", "반드시", "긴급", "즉시", "빠른"
- low   : "여유롭게", "천천히", "언젠가", "나중에", "여유"
- medium: "보통", "적당히", 또는 우선순위 키워드 없음

=== 카테고리 분류 키워드 ===
- "업무" : 회의, 보고서, 프로젝트, 업무, 미팅, 발표, 기획
- "개인" : 쇼핑, 친구, 가족, 개인, 약속, 청소, 장보기
- "건강" : 운동, 병원, 건강, 요가, 헬스, 검진, 약
- "학습" : 공부, 책, 강의, 학습, 과제, 시험, 독서
- 복수 카테고리 가능 (해당하는 것 모두 포함)
- 해당 없으면 빈 배열 []

=== 출력 형식 (반드시 준수) ===
{
  "title": "핵심 동작과 대상만 포함한 간결한 제목 (날짜·시간·우선순위 키워드 제외)",
  "due_date": "YYYY-MM-DD 또는 null",
  "start_time": "HH:MM (24시간제) 또는 null",
  "due_time": "HH:MM (24시간제)",
  "priority": "high | medium | low",
  "category": ["카테고리"]
}

=== 분석할 입력 텍스트 ===
"${text}"`;

  return { prompt, todayStr };
};

// ── 4. 후처리 ─────────────────────────────────────────────────────
/**
 * AI 응답 JSON을 검증·정규화하고 기본값을 설정합니다.
 * - 제목 길이 자동 조정 (너무 짧으면 원본 사용, 너무 길면 단어 경계에서 자름)
 * - 과거 날짜 여부 플래그 추가
 * - 누락된 필수 필드에 기본값 설정
 */
const postProcess = (
  raw: Record<string, unknown>,
  todayStr: string,
  fallbackText: string
): ParsedTodo => {
  // 제목
  let title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (title.length < TITLE_MIN_LENGTH) {
    // 너무 짧으면 원본 입력으로 대체 (앞 30자)
    title = fallbackText.slice(0, 30).trim();
  }
  if (title.length > TITLE_MAX_LENGTH) {
    // 단어 경계에서 자름
    const truncated = title.slice(0, TITLE_MAX_LENGTH);
    const lastSpace = truncated.lastIndexOf(' ');
    title = (lastSpace > TITLE_MIN_LENGTH ? truncated.slice(0, lastSpace) : truncated).trim();
  }

  // due_date + 과거 날짜 확인
  const rawDate = typeof raw.due_date === 'string' ? raw.due_date : null;
  const dueDate = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
  const isPastDate = dueDate !== null && dueDate < todayStr;

  // start_time (없으면 null)
  const rawStartTime = typeof raw.start_time === 'string' ? raw.start_time : '';
  const startTime = /^\d{2}:\d{2}$/.test(rawStartTime) ? rawStartTime : null;

  // due_time (기본값: 09:00)
  const rawTime = typeof raw.due_time === 'string' ? raw.due_time : '';
  const dueTime = /^\d{2}:\d{2}$/.test(rawTime) ? rawTime : '09:00';

  // priority (기본값: medium)
  const rawPriority = typeof raw.priority === 'string' ? raw.priority : '';
  const priority = (VALID_PRIORITIES as readonly string[]).includes(rawPriority)
    ? (rawPriority as Priority)
    : 'medium';

  // category (기본값: [])
  const category = Array.isArray(raw.category)
    ? (raw.category as unknown[])
        .filter((c): c is string => typeof c === 'string')
        .map((c) => c.trim())
        .filter(Boolean)
    : typeof raw.category === 'string'
      ? [raw.category.trim()].filter(Boolean)
      : [];

  return {
    title,
    due_date: dueDate,
    start_time: startTime,
    due_time: dueTime,
    priority,
    category,
    ...(isPastDate && { past_date_warning: true }),
  };
};

// ── 5. AI SDK 오류 분류 ───────────────────────────────────────────
/**
 * AI SDK / Gemini API 오류를 HTTP 상태 코드와 사용자 친화적 메시지로 변환합니다.
 */
const classifyAiError = (err: unknown): { message: string; status: 429 | 500 | 503 } => {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;

    // API 호출 한도 초과 (429)
    if (e['statusCode'] === 429 || (typeof e['message'] === 'string' && e['message'].includes('quota'))) {
      return {
        message: 'AI 서비스 호출 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.',
        status: 429,
      };
    }

    // API 키 무효 / 서비스 불가 (503)
    if (
      e['statusCode'] === 400 &&
      typeof e['responseBody'] === 'string' &&
      e['responseBody'].includes('API_KEY_INVALID')
    ) {
      return {
        message: 'AI 서비스 인증에 실패했습니다. 관리자에게 문의해 주세요.',
        status: 503,
      };
    }

    // 서비스 일시 중단 (503)
    if (e['statusCode'] === 503 || e['statusCode'] === 502) {
      return {
        message: 'AI 서비스가 일시적으로 이용 불가합니다. 잠시 후 다시 시도해 주세요.',
        status: 503,
      };
    }
  }

  return {
    message: 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    status: 500,
  };
};

// ── 메인 핸들러 ───────────────────────────────────────────────────
export const POST = async (req: NextRequest) => {
  // ① 요청 본문 파싱
  let rawText: unknown;
  try {
    const body = await req.json();
    rawText = body?.text;
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  if (typeof rawText !== 'string') {
    return NextResponse.json({ error: '분석할 텍스트를 입력해 주세요.' }, { status: 400 });
  }

  // ② 전처리
  const cleanedText = normalizeInput(rawText);

  // ③ 입력 검증
  const validationError = validateInput(cleanedText);
  if (validationError) {
    return NextResponse.json({ error: validationError.message }, { status: validationError.status });
  }

  // ④ 환경 변수 확인
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'AI 서비스가 설정되지 않았습니다. 관리자에게 문의해 주세요.' },
      { status: 503 }
    );
  }

  // ⑤ AI 호출
  const { prompt, todayStr } = buildPrompt(cleanedText);
  let aiResponse: string;

  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
    });
    aiResponse = text;
  } catch (err) {
    console.error('[AI 파싱] AI 호출 실패:', err);
    const { message, status } = classifyAiError(err);
    return NextResponse.json({ error: message }, { status });
  }

  // ⑥ JSON 추출
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[AI 파싱] JSON 추출 실패. 원본 응답:', aiResponse);
    return NextResponse.json(
      { error: 'AI 응답을 해석할 수 없습니다. 다시 시도해 주세요.' },
      { status: 500 }
    );
  }

  let rawParsed: Record<string, unknown>;
  try {
    rawParsed = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    console.error('[AI 파싱] JSON 파싱 오류:', parseErr, '원본:', jsonMatch[0]);
    return NextResponse.json(
      { error: 'AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.' },
      { status: 500 }
    );
  }

  // ⑦ 후처리
  const result = postProcess(rawParsed, todayStr, cleanedText);

  if (!result.title) {
    return NextResponse.json(
      { error: '할 일 제목을 추출할 수 없습니다. 더 구체적으로 입력해 주세요.' },
      { status: 422 }
    );
  }

  return NextResponse.json(result);
};

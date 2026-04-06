<<<<<<< HEAD
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextRequest, NextResponse } from 'next/server';

const buildPrompt = (rawText: string) => {
  const todayKr = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  return `오늘 날짜(참고): ${todayKr}
사용자 입력: "${rawText.trim()}"
위 내용에서 일정 정보를 추출해 JSON만 출력하세요. 마크다운·코드펜스·설명 금지.
형식: {"title":"짧은 제목","desc":"상세(장소·시간·메모)","start":"YYYY-MM-DDTHH:mm","end":"YYYY-MM-DDTHH:mm"}
- 날짜가 없으면 오늘(한국 날짜) 기준.
- end는 start보다 이후(없으면 start + 1시간).`;
};

=======
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
>>>>>>> e0c6404a2a0939c533dec3f008e7226dfdbc7b15
/**
 * Groq OpenAI 호환 API로 텍스트만 받기 (서버 전용)
 * .env: GROQ_API_KEY 권장, 기존 NEXT_PUBLIC_GROQ_API_KEY 도 인식
 */
const generateWithGroq = async (apiKey: string, prompt: string): Promise<string> => {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    const msg = errBody.error?.message ?? `Groq HTTP ${res.status}`;
    throw new Error(msg);
  }

<<<<<<< HEAD
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
=======
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
>>>>>>> e0c6404a2a0939c533dec3f008e7226dfdbc7b15
  };
  const text = data.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Groq 응답이 비어 있습니다.');
  return text;
};

const generateWithGoogle = async (prompt: string): Promise<string> => {
  const { text } = await generateText({
    model: google('gemini-2.0-flash'),
    prompt,
  });
  return text;
};

const extractJsonObject = (text: string) => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
};

/**
 * 자연어 → 일정 JSON (Groq 우선, 없으면 Google Gemini)
 */
export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const rawText =
      typeof body.rawText === 'string'
        ? body.rawText
        : typeof body.text === 'string'
          ? body.text
          : '';

    if (!rawText.trim()) {
      return NextResponse.json({ error: '입력 문장이 필요합니다.' }, { status: 400 });
    }

    const prompt = buildPrompt(rawText);
    const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const hasGoogle = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    let aiText: string;

    if (groqKey) {
      try {
        aiText = await generateWithGroq(groqKey, prompt);
      } catch (groqErr) {
        console.error('[ai-parse-todo] Groq 실패:', groqErr);
        if (!hasGoogle) {
          const message =
            groqErr instanceof Error ? groqErr.message : 'Groq 호출에 실패했습니다.';
          return NextResponse.json({ error: message }, { status: 502 });
        }
        aiText = await generateWithGoogle(prompt);
      }
    } else if (hasGoogle) {
      aiText = await generateWithGoogle(prompt);
    } else {
      return NextResponse.json(
        {
          error:
            'AI 키가 없습니다. .env.local에 GROQ_API_KEY 또는 GOOGLE_GENERATIVE_AI_API_KEY를 설정해 주세요.',
        },
        { status: 503 },
      );
    }

    const parsed = extractJsonObject(aiText);
    if (!parsed) {
      return NextResponse.json(
        { error: 'AI 응답을 JSON으로 파싱할 수 없습니다.' },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error('[ai-parse-todo]', error);
    const message = error instanceof Error ? error.message : '분석에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
<<<<<<< HEAD
=======

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
>>>>>>> e0c6404a2a0939c533dec3f008e7226dfdbc7b15
};

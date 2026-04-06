<<<<<<< HEAD
import { google } from '@ai-sdk/google';
=======
/**
 * AI 할 일 분석 API 라우트
 * 사용자의 할 일 목록을 다각도로 분석해 요약, 인사이트, 추천 사항을 생성합니다.
 */
import { createGroq } from '@ai-sdk/groq';
>>>>>>> e0c6404a2a0939c533dec3f008e7226dfdbc7b15
import { generateText } from 'ai';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
import { NextRequest, NextResponse } from 'next/server';

/**
 * AI 할 일 분석 API
 * 사용자가 입력한 문장에서 제목, 상세내용, 시작/마감 시간을 추출합니다.
 */

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "프롬프트가 없습니다." }, { status: 400 });
    }

<<<<<<< HEAD
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: `
        사용자 입력: "${prompt}"
        
        위 문장에서 다음 정보를 추출해서 반드시 순수한 JSON 형식으로만 응답해줘.
        형식: { 
          "title": "할 일 제목", 
          "description": "장소나 메모 등 상세 내용", 
          "start_time": "YYYY-MM-DDTHH:mm", 
          "end_time": "YYYY-MM-DDTHH:mm" 
        }
        
        - 연도 정보가 없으면 현재 연도(2026년)를 기준으로 해줘.
        - 시간 정보가 없으면 시작은 현재 시간, 마감은 시작 1시간 후로 설정해줘.
        - JSON 외에 다른 설명이나 마크다운( \`\`\`json )은 절대 포함하지 마.
      `,
=======
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
>>>>>>> e0c6404a2a0939c533dec3f008e7226dfdbc7b15
    });

    // AI 응답에서 JSON만 골라내기 (혹시 모를 오류 방지)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("AI 분석 API 오류:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
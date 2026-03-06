/**
 * AI 요약 생성 API 라우트
 * Google Gemini를 사용해 할 일 항목의 AI 요약을 생성합니다.
 */
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (req: NextRequest) => {
  try {
    const { title, description } = await req.json();

    if (!title) {
      return NextResponse.json({ error: '제목이 필요합니다.' }, { status: 400 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'AI 서비스가 설정되지 않았습니다. GOOGLE_GENERATIVE_AI_API_KEY를 환경변수에 추가해 주세요.' },
        { status: 503 }
      );
    }

    const prompt = `다음 할 일 항목을 한국어로 1-2문장으로 간결하게 요약해주세요. 핵심 내용과 목적만 담아 간략히 작성해 주세요.

제목: ${title}${description ? `\n설명: ${description}` : ''}

요약 (1-2문장):`;

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
    });

    return NextResponse.json({ summary: text.trim() });
  } catch (err) {
    console.error('AI 요약 생성 실패:', err);
    return NextResponse.json({ error: 'AI 요약을 생성할 수 없습니다.' }, { status: 500 });
  }
};

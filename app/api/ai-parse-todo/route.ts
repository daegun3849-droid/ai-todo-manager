import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (req: NextRequest) => {
  try {
    const { rawText } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
    }

    const { text } = await generateText({
      // 💡 해결책: 가장 기본 모델명인 'gemini-1.5-flash' 사용
      // 만약 이것도 안된다면 'gemini-pro'로 테스트해보세요.
      model: google('gemini-1.5-flash'),
      apiKey: apiKey,
      prompt: `오늘 날짜: ${new Date().toLocaleString('ko-KR')}
      사용자 입력: "${rawText}"
      상기 문장에서 정보를 추출해 JSON으로만 답해줘. 마크다운 기호는 쓰지 마.
      {"title":"제목 요약","desc":"상세내용","start":"YYYY-MM-DDTHH:mm","end":"YYYY-MM-DDTHH:mm"}`,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI 응답 파싱 실패');

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error: any) {
    console.error("🚨 서버 분석 에러 상세:", error);
    return NextResponse.json({ error: error.message || '분석 실패' }, { status: 500 });
  }
};
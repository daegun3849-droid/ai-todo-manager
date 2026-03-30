import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 자연어 입력에서 일정 필드를 추출하는 API (Gemini)
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

    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      prompt: `오늘 날짜(참고): ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
사용자 입력: "${rawText.trim()}"
위 내용에서 일정 정보를 추출해 JSON만 출력하세요. 마크다운·코드펜스·설명 금지.
형식: {"title":"짧은 제목","desc":"상세(장소·시간·메모)","start":"YYYY-MM-DDTHH:mm","end":"YYYY-MM-DDTHH:mm"}
- 날짜가 없으면 오늘(한국 날짜) 기준.
- end는 start보다 이후(없으면 start + 1시간).`,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 응답을 JSON으로 파싱할 수 없습니다.' }, { status: 502 });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error: unknown) {
    console.error('[ai-parse-todo]', error);
    const message = error instanceof Error ? error.message : '분석에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
};

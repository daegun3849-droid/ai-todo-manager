/**
 * AI Planner 사용 설명서 페이지 (/guide)
 */

import Link from "next/link";

const sections = [
  {
    emoji: "🚀",
    title: "시작하기",
    steps: [
      {
        label: "회원가입",
        desc: "우측 상단 로그인 버튼 → 회원가입 페이지에서 이메일·비밀번호 입력",
      },
      {
        label: "로그인",
        desc: "이메일·비밀번호로 로그인하면 내 일정이 저장됩니다. 기기를 바꿔도 데이터가 유지돼요.",
      },
    ],
  },
  {
    emoji: "✅",
    title: "일정 등록",
    steps: [
      {
        label: "직접 입력",
        desc: "제목·시작·마감 날짜를 직접 입력하고 「일정 저장하기」 버튼을 누르세요.",
      },
      {
        label: "✨ AI 자동완성",
        desc: "자연어로 입력하면 AI가 제목·시간을 자동으로 채워줍니다.\n예) \"내일 오후 3시 팀 회의 1시간\" → 자동으로 파싱·저장",
      },
      {
        label: "여러 일정 한 번에",
        desc: "\"9시 회의, 11시 보고, 2시 미팅\" 처럼 여러 일정을 한 번에 입력하면 자동으로 분리해서 저장해줘요.",
      },
    ],
  },
  {
    emoji: "🎤",
    title: "음성으로 일정 등록",
    steps: [
      {
        label: "마이크 버튼 클릭",
        desc: "입력 폼의 마이크(🎙️) 버튼을 누르고 말하면 자동으로 입력란에 들어옵니다.",
      },
      {
        label: "주의사항",
        desc: "크롬 브라우저 + HTTPS 환경에서만 동작합니다. 주소창에서 마이크 권한을 허용해 주세요.",
      },
    ],
  },
  {
    emoji: "📅",
    title: "달력 & 일정 보기",
    steps: [
      {
        label: "날짜 클릭 → 필터",
        desc: "오른쪽 달력에서 날짜를 클릭하면 그 날 일정만 표시됩니다. 「전체보기」 버튼으로 해제할 수 있어요.",
      },
      {
        label: "초록 점 표시",
        desc: "일정이 있는 날짜에 초록 점이 표시됩니다.",
      },
      {
        label: "빠른 일정 추가",
        desc: "달력에서 날짜를 클릭하면 아래에 빠른 추가 입력창이 나타납니다.",
      },
    ],
  },
  {
    emoji: "🔔",
    title: "알림 설정",
    steps: [
      {
        label: "알림 허용",
        desc: "헤더의 🔔 알림 버튼을 클릭하면 브라우저 알림 허용 팝업이 뜹니다. 허용해야 알림을 받을 수 있어요.",
      },
      {
        label: "시작 30분 전 알림",
        desc: "일정 시작 30분 전에 팝업 알림과 삐- 소리(1번)가 납니다.",
      },
      {
        label: "종료 시각 알림",
        desc: "일정 종료 시각에 팝업 알림과 삐삐- 소리(2번)가 납니다.",
      },
      {
        label: "주의사항",
        desc: "알림은 사이트 탭을 열어둔 상태에서만 동작합니다. 탭을 닫으면 알림을 받을 수 없어요.",
      },
    ],
  },
  {
    emoji: "🔁",
    title: "루틴 (매일 반복 할 일)",
    steps: [
      {
        label: "루틴 추가",
        desc: "운동, 복약, 독서 등 매일 반복하는 할 일을 루틴으로 등록하세요. 이모지로 구분할 수 있어요.",
      },
      {
        label: "완료 체크",
        desc: "오늘 한 루틴을 체크하면 완료율 프로그레스 바가 올라갑니다.",
      },
      {
        label: "매일 자동 초기화",
        desc: "루틴 완료 여부는 날짜 기준으로 매일 자동 초기화됩니다.",
      },
    ],
  },
  {
    emoji: "📋",
    title: "템플릿 마켓",
    steps: [
      {
        label: "기본 템플릿",
        desc: "아침 루틴, 딥워크, 면접 준비, 시험 벼락치기 등 자주 쓰는 일정 패턴을 한 번에 적용할 수 있어요.",
      },
      {
        label: "내 템플릿 저장",
        desc: "현재 입력 내용을 「내 템플릿으로 저장」 버튼으로 저장해 두면 다음에 바로 불러올 수 있어요.",
      },
    ],
  },
  {
    emoji: "📱",
    title: "모바일에서 앱처럼 쓰기",
    steps: [
      {
        label: "안드로이드 (크롬)",
        desc: "브라우저 메뉴(⋮) → 홈 화면에 추가 → 아이콘 탭하면 앱처럼 실행되고 알림도 더 잘 옵니다.",
      },
      {
        label: "아이폰 (사파리)",
        desc: "공유 버튼(□↑) → 홈 화면에 추가 → 홈 화면에서 아이콘으로 실행하세요.",
      },
    ],
  },
];

const GuideSection = ({
  emoji,
  title,
  steps,
}: {
  emoji: string;
  title: string;
  steps: { label: string; desc: string }[];
}) => (
  <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
    <h2 className="text-[17px] md:text-[20px] font-black text-slate-800 mb-5 flex items-center gap-2">
      <span className="text-2xl">{emoji}</span> {title}
    </h2>
    <ol className="space-y-4">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[12px] font-black flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <div>
            <p className="text-[14px] md:text-[15px] font-black text-slate-700 mb-0.5">{step.label}</p>
            <p className="text-[12px] md:text-[13px] text-slate-500 leading-relaxed whitespace-pre-line">
              {step.desc}
            </p>
          </div>
        </li>
      ))}
    </ol>
  </section>
);

const GuidePage = () => (
  <div className="min-h-screen bg-[#F8F9FD] font-sans text-slate-900">
    <div className="max-w-xl md:max-w-3xl mx-auto px-4 md:px-8 pb-24 pt-8">

      {/* 상단 헤더 */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] md:text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors mb-5"
        >
          ← 앱으로 돌아가기
        </Link>
        <h1 className="text-[28px] md:text-[40px] font-black text-[#1A202C] tracking-tighter">
          📖 사용 설명서
        </h1>
        <p className="text-[13px] md:text-[15px] text-slate-500 mt-2">
          AI Planner를 100% 활용하는 방법을 안내합니다.
        </p>

        {/* 바로 시작 버튼 */}
        <div className="mt-4 flex gap-3 flex-wrap">
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-emerald-500 text-white text-[13px] font-black rounded-xl hover:bg-emerald-600 transition-all active:scale-95"
          >
            무료로 시작하기 →
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 bg-slate-100 text-slate-700 text-[13px] font-black rounded-xl hover:bg-slate-200 transition-all active:scale-95"
          >
            로그인
          </Link>
        </div>
      </div>

      {/* 핵심 기능 한눈에 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { icon: "✨", label: "AI 자동완성" },
          { icon: "🎤", label: "음성 입력" },
          { icon: "🔔", label: "시간 알림" },
          { icon: "🔁", label: "매일 루틴" },
        ].map((f) => (
          <div
            key={f.label}
            className="bg-white rounded-2xl p-4 text-center shadow-sm border border-slate-100"
          >
            <p className="text-3xl mb-1">{f.icon}</p>
            <p className="text-[12px] md:text-[13px] font-black text-slate-700">{f.label}</p>
          </div>
        ))}
      </div>

      {/* 섹션별 설명 */}
      <div className="space-y-5">
        {sections.map((s) => (
          <GuideSection key={s.title} {...s} />
        ))}
      </div>

      {/* 하단 CTA */}
      <div className="mt-10 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-3xl p-7 border border-emerald-100 text-center">
        <p className="text-[16px] md:text-[18px] font-black text-emerald-700 mb-1">
          지금 바로 시작해보세요!
        </p>
        <p className="text-[12px] md:text-[13px] text-slate-500 mb-4">
          무료로 가입하고 AI가 내 일정을 정리해드립니다.
        </p>
        <Link
          href="/signup"
          className="inline-block px-7 py-3 bg-emerald-500 text-white text-[14px] font-black rounded-2xl hover:bg-emerald-600 transition-all active:scale-95 shadow-md"
        >
          무료 회원가입 →
        </Link>
      </div>

    </div>
  </div>
);

export default GuidePage;

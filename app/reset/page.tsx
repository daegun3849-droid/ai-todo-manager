/**
 * 삶 리셋 — 5가지 실천 원칙 페이지 (/reset)
 */

"use client";

import { useState } from "react";
import Link from "next/link";

const principles = [
  {
    number: "01",
    emoji: "⏰",
    color: "from-blue-500 to-blue-400",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    title: "시간 리셋",
    subtitle: "지각하지 않는 사람 되기",
    practices: [
      "약속은 항상 10분 먼저 도착한다",
      "알람은 2개 설정한다",
      "전날 가방과 옷을 미리 준비한다",
    ],
    check: "오늘도 10분 먼저 도착했다",
  },
  {
    number: "02",
    emoji: "💪",
    color: "from-emerald-500 to-emerald-400",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-100 text-emerald-700",
    title: "몸 리셋",
    subtitle: "운동은 선택이 아닌 습관",
    practices: [
      "매일 30분 걷기",
      "팔굽혀펴기 20회",
      "스쿼트 30회",
      "스트레칭 10분",
    ],
    check: "하기 싫어도 10분은 반드시 했다",
    principle: "하기 싫어도 10분은 반드시 한다",
  },
  {
    number: "03",
    emoji: "📚",
    color: "from-violet-500 to-violet-400",
    bg: "bg-violet-50",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-700",
    title: "생각 리셋",
    subtitle: "매일 성장하기",
    practices: [
      "독서 20쪽",
      "AI 또는 새로운 기술 30분 공부",
      "배운 내용 3줄 기록",
      "하루 하나 실천",
    ],
    check: "오늘 어제보다 무엇을 하나 더 배웠다",
  },
  {
    number: "04",
    emoji: "🤝",
    color: "from-amber-500 to-amber-400",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    title: "인생 리셋",
    subtitle: "성실은 신뢰를 만든다",
    practices: [
      "약속은 반드시 지킨다",
      "거짓말하지 않는다",
      "맡은 일은 끝까지 책임진다",
      "하루 목표 3가지를 반드시 완료한다",
    ],
    check: "미룬 일이 없다",
  },
  {
    number: "05",
    emoji: "🔁",
    color: "from-rose-500 to-rose-400",
    bg: "bg-rose-50",
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-700",
    title: "성공 리셋",
    subtitle: "반복이 인생을 바꾼다",
    practices: [
      "좋은 습관을 100일 동안 끊기지 않는다",
      "실패해도 다음 날 바로 다시 시작한다",
      "완벽보다 꾸준함을 선택한다",
    ],
    check: '오늘도 "1% 성장"을 실천했다',
  },
];

const morningTasks = [
  "6시 기상",
  "물 한 잔",
  "스트레칭",
  "오늘 목표 3가지 작성",
];
const afternoonTasks = [
  "운동",
  "독서 20쪽",
  "AI·디자인 공부 30분",
  "맡은 일 끝내기",
];
const eveningTasks = [
  "오늘 감사한 일 3가지",
  "배운 것 기록",
  "내일 준비하기",
  "11시 이전 취침",
];

const ResetPage = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const totalChecks =
    morningTasks.length + afternoonTasks.length + eveningTasks.length + principles.length;
  const doneCount = Object.values(checked).filter(Boolean).length;
  const percent = Math.round((doneCount / totalChecks) * 100);

  return (
    <div className="min-h-screen bg-[#F8F9FD] font-sans text-slate-900">
      <div className="max-w-2xl mx-auto px-4 pb-24 pt-6">

        {/* 상단 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← 플래너로
          </Link>
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
            Life Reset
          </span>
        </div>

        {/* 타이틀 */}
        <div className="mb-10 text-center">
          <p className="text-[12px] font-black text-emerald-500 uppercase tracking-widest mb-2">
            Daily Reset System
          </p>
          <h1 className="text-[32px] font-black text-slate-900 leading-tight tracking-tight">
            삶을 리셋하는<br />5가지 실천 원칙
          </h1>
          <p className="mt-3 text-[14px] text-slate-500 font-medium">
            단순한 다짐이 아닌, 매일 실천 가능한 시스템
          </p>
        </div>

        {/* 오늘 진행률 */}
        <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-100 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[13px] font-black text-slate-700">오늘의 실천률</span>
            <span className="text-[13px] font-black text-emerald-600">{doneCount} / {totalChecks}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-[11px] font-bold text-slate-400">{percent}% 완료</p>
        </div>

        {/* 5가지 원칙 카드 */}
        <div className="space-y-5 mb-10">
          {principles.map((p) => (
            <div
              key={p.number}
              className={`rounded-3xl border ${p.border} ${p.bg} p-6 shadow-sm`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-[22px] shadow-md shrink-0`}>
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.badge}`}>
                      {p.number}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">{p.subtitle}</span>
                  </div>
                  <h2 className="text-[18px] font-black text-slate-800 mb-3">{p.title}</h2>

                  {/* 실천 목록 */}
                  <ul className="space-y-1.5 mb-4">
                    {p.practices.map((practice, i) => (
                      <li key={i} className="flex items-center gap-2 text-[13px] font-medium text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        {practice}
                      </li>
                    ))}
                  </ul>

                  {/* 매일 체크 */}
                  <button
                    type="button"
                    onClick={() => toggle(`principle-${p.number}`)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                      checked[`principle-${p.number}`]
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300"
                    }`}
                  >
                    <span className="text-[18px]">
                      {checked[`principle-${p.number}`] ? "✅" : "☐"}
                    </span>
                    <span className="text-[13px] font-bold">{p.check}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 하루 실행표 */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 mb-8">
          <h2 className="text-[18px] font-black text-slate-900 mb-5">📋 나의 하루 실행표</h2>

          {[
            { label: "🌅 아침", tasks: morningTasks, prefix: "morning" },
            { label: "☀️ 낮", tasks: afternoonTasks, prefix: "afternoon" },
            { label: "🌙 저녁", tasks: eveningTasks, prefix: "evening" },
          ].map(({ label, tasks, prefix }) => (
            <div key={prefix} className="mb-5 last:mb-0">
              <p className="text-[13px] font-black text-slate-500 uppercase tracking-wider mb-2">{label}</p>
              <div className="space-y-2">
                {tasks.map((task, i) => {
                  const key = `${prefix}-${i}`;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggle(key)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-left ${
                        checked[key]
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-200"
                      }`}
                    >
                      <span className="text-[16px]">{checked[key] ? "✅" : "☐"}</span>
                      <span className={`text-[13px] font-bold transition-all ${checked[key] ? "line-through opacity-60" : ""}`}>
                        {task}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 선언문 */}
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-700 rounded-3xl p-7 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500 opacity-10 rounded-full -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full translate-y-10 -translate-x-10" />
          <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest mb-3">나의 삶 리셋 선언문</p>
          <div className="space-y-3 text-[14px] font-medium text-slate-200 leading-relaxed relative z-10">
            <p>나는 과거의 실패보다 <span className="text-white font-black">오늘의 실천</span>을 선택한다.</p>
            <p>나는 시간을 지키고, 몸을 단련하며, 매일 배우고,<br />맡은 일에 성실하며, 작은 습관을 반복한다.</p>
            <p>내 삶은 한 번의 결심이 아니라 <span className="text-white font-black">매일의 실천</span>으로 바뀐다.</p>
            <p>오늘도 <span className="text-emerald-400 font-black">1% 성장</span>하고,<br />100일 후에는 완전히 달라진 나를 만든다.</p>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-600">
            <p className="text-[15px] font-black text-white tracking-tight">
              나는 말보다 행동으로 증명하는 사람이다. 🔥
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResetPage;

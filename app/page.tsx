"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

interface Todo {
  id: number;
  content: string;
  start_time: string;
  end_time: string;
  is_completed: boolean;
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 1. 로그인 확인 및 데이터 불러오기
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchTodos(user.id);
      }
    };
    checkUser();
  }, []);

  const fetchTodos = async (userId: string) => {
    const { data } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", userId)
      .order("start_time", { ascending: true });
    if (data) setTodos(data);
  };

  // 2. AI 일정 분석 및 저장
  const handleAIAnalysis = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        prompt: `텍스트: "${input}" 에서 일정 제목, 시작시간, 종료시간을 추출해 JSON으로 줘. 형식: { "title": "제목", "start": "YYYY-MM-DD HH:mm", "end": "YYYY-MM-DD HH:mm" }. 현재날짜: ${new Date().toLocaleString('ko-KR')}`,
      });
      
      const result = JSON.parse(text.replace(/```json|```/g, ""));
      
      const { error } = await supabase.from("todos").insert([
        {
          content: result.title,
          start_time: new Date(result.start).toISOString(),
          end_time: new Date(result.end).toISOString(),
          user_id: user.id,
          is_completed: false
        },
      ]);

      if (!error) {
        setInput("");
        fetchTodos(user.id);
      }
    } catch (e) {
      console.error(e);
      alert("AI 분석 실패. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 p-4 pb-10">
      <header className="py-8 text-left">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI PLANNER</h1>
        <p className="text-sm font-medium text-blue-600 mt-1">반갑습니다, {user?.email?.split('@')[0]}님! 👋</p>
      </header>

      {/* 입력창 카드 */}
      <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-200/50 mb-8 border border-white">
        <textarea
          className="w-full p-4 bg-slate-50 rounded-2xl text-slate-900 text-base placeholder:text-slate-400 outline-none border-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          rows={3}
          placeholder="예: 내일 오후 2시 강남 미팅"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleAIAnalysis}
          disabled={loading}
          className="w-full mt-4 bg-slate-900 text-white py-4 rounded-2xl font-bold text-base active:scale-95 transition-all disabled:bg-slate-300 shadow-lg shadow-slate-900/20"
        >
          {loading ? "AI가 분석 중..." : "✨ 일정 추가하기"}
        </button>
      </div>

      {/* 일정 리스트 */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">My Plan List ({todos.length})</h2>
        
        {todos.map((todo) => (
          <div key={todo.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 transition-all">
            <div className="flex items-start justify-between gap-4 mb-4">
              <span className={`text-lg font-bold text-slate-900 leading-tight ${todo.is_completed ? 'line-through text-slate-300' : ''}`}>
                {todo.content}
              </span>
              <input 
                type="checkbox" 
                checked={todo.is_completed}
                className="w-6 h-6 rounded-full border-slate-200 text-blue-600 focus:ring-blue-500 mt-1"
                onChange={async () => {
                  await supabase.from("todos").update({ is_completed: !todo.is_completed }).eq("id", todo.id);
                  fetchTodos(user.id);
                }}
              />
            </div>
            
            {/* 🕒 시간 표시 영역 (글씨 색상 강조) */}
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase">시작</span>
                <span className="text-sm font-bold text-slate-700">
                  {new Date(todo.start_time).toLocaleString('ko-KR', { 
                    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-black bg-rose-50 text-rose-500 px-2 py-1 rounded-md uppercase">마감</span>
                <span className="text-sm font-bold text-slate-700">
                  {new Date(todo.end_time).toLocaleString('ko-KR', { 
                    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {todos.length === 0 && (
          <div className="text-center py-20 text-slate-300 font-medium">
            등록된 일정이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
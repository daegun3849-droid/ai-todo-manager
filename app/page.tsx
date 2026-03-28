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

  // 1. 초기 데이터 불러오기
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
        fetchTodos(data.user.id);
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

  // 2. AI 자동완성 로직
  const handleAIAnalysis = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        prompt: `텍스트: "${input}" 에서 일정 제목, 시작시간, 종료시간을 추출해 JSON으로 줘. 형식: { "title": "제목", "start": "YYYY-MM-DD HH:mm", "end": "YYYY-MM-DD HH:mm" }. 현재날짜: ${new Date().toISOString()}`,
      });
      
      const result = JSON.parse(text.replace(/```json|```/g, ""));
      
      // 추출된 데이터로 바로 추가
      const { error } = await supabase.from("todos").insert([
        {
          content: result.title,
          start_time: new Date(result.start).toISOString(),
          end_time: new Date(result.end).toISOString(),
          user_id: user.id,
        },
      ]);

      if (!error) {
        setInput("");
        fetchTodos(user.id);
      }
    } catch (e) {
      console.error(e);
      alert("AI 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-20 min-h-screen bg-gray-50">
      <header className="py-6 mb-4">
        <h1 className="text-2xl font-bold text-slate-800">🗓️ AI 플래너</h1>
        <p className="text-sm text-slate-500">반갑습니다, {user?.email?.split('@')[0]}님!</p>
      </header>

      {/* 입력 섹션 */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 border border-slate-100">
        <textarea
          className="w-full p-3 border-none bg-slate-50 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          rows={3}
          placeholder="예: 내일 오후 2시 강남역 미팅"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={handleAIAnalysis}
          disabled={loading}
          className="w-full mt-3 bg-slate-900 text-white py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform disabled:bg-slate-300"
        >
          {loading ? "AI 분석 중..." : "✨ AI 일정 추가하기"}
        </button>
      </div>

      {/* 리스트 섹션 */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-700 px-1">나의 일정 ({todos.length})</h2>
        {todos.map((todo) => (
          <div key={todo.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <span className={`font-semibold text-slate-800 ${todo.is_completed ? 'line-through text-slate-400' : ''}`}>
                {todo.content}
              </span>
              <input 
                type="checkbox" 
                checked={todo.is_completed}
                className="w-5 h-5 rounded-full border-slate-300 text-blue-600 focus:ring-blue-500"
                onChange={async () => {
                  await supabase.from("todos").update({ is_completed: !todo.is_completed }).eq("id", todo.id);
                  fetchTodos(user.id);
                }}
              />
            </div>
            
            {/* 🕒 시간 표시 영역 (모바일 최적화) */}
            <div className="grid grid-cols-1 gap-2 border-t pt-3 border-slate-50">
              <div className="flex items-center text-[11px] text-slate-500">
                <span className="w-10 font-bold text-blue-500">시작</span>
                <span>{new Date(todo.start_time).toLocaleString('ko-KR', { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}</span>
              </div>
              <div className="flex items-center text-[11px] text-slate-500">
                <span className="w-10 font-bold text-red-400">마감</span>
                <span>{new Date(todo.end_time).toLocaleString('ko-KR', { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
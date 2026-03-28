"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

interface Todo {
  id: number;
  content: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_completed: boolean;
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [rawInput, setRawInput] = useState(""); 
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

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
    const { data } = await supabase.from("todos").select("*").eq("user_id", userId).order("start_time", { ascending: true });
    if (data) setTodos(data);
  };

  const handleAIAutoFill = async () => {
    if (!rawInput.trim()) return;
    setLoading(true);
    try {
      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        prompt: `텍스트: "${rawInput}" 에서 정보를 추출해 JSON으로 줘. 형식: { "title": "제목", "desc": "상세내용(장소/메모)", "start": "YYYY-MM-DDTHH:mm", "end": "YYYY-MM-DDTHH:mm" }. 현재시간: ${new Date().toISOString()}`,
      });
      const res = JSON.parse(text.replace(/```json|```/g, ""));
      setTitle(res.title || "");
      setDescription(res.desc || "");
      setStartTime(res.start?.slice(0, 16) || "");
      setEndTime(res.end?.slice(0, 16) || "");
    } catch (e) {
      alert("AI 분석 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async () => {
    if (!title) return alert("제목을 입력해주세요.");
    const { error } = await supabase.from("todos").insert([{
      content: title,
      description: description,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      user_id: user.id,
    }]);
    if (!error) {
      setTitle(""); setDescription(""); setStartTime(""); setEndTime(""); setRawInput("");
      fetchTodos(user.id);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] p-5 pb-20 font-sans text-slate-900">
      <header className="flex justify-between items-center py-6">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900">AI PLANNER</h1>
          <p className="text-sm font-bold text-blue-600">반갑습니다, {user?.email?.split('@')[0]}님! 👋</p>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/login")} className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-xl">로그아웃</button>
      </header>

      {/* [1] AI 처리 영역 */}
      <section className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest">1. AI 분석 입력</span>
          <button onClick={handleAIAutoFill} disabled={loading} className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md shadow-blue-200">
            {loading ? "분석중..." : "✨ 자동 완성"}
          </button>
        </div>
        <textarea 
          className="w-full p-4 bg-slate-50 rounded-2xl text-sm outline-none border-none focus:ring-2 focus:ring-blue-100"
          placeholder="예: 내일 오후 2시 강남역 미팅"
          rows={2}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
        />
      </section>

      {/* [2, 3, 4] 상세 입력 영역 */}
      <section className="bg-white rounded-[32px] p-6 shadow-xl shadow-slate-200/50 mb-10 border border-white">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-5">2. 일정 상세 정보</span>
        <div className="space-y-5">
          {/* 대제목 */}
          <div>
            <label className="text-xs font-black text-slate-500 ml-1">제목</label>
            <input className="w-full mt-1.5 p-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-900 border-none focus:ring-2 focus:ring-blue-100" value={title} onChange={e => setTitle(e.target.value)} placeholder="일정 제목을 입력하세요" />
          </div>
          {/* 상세설명 */}
          <div>
            <label className="text-xs font-black text-slate-500 ml-1">상세 설명</label>
            <textarea className="w-full mt-1.5 p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 border-none focus:ring-2 focus:ring-blue-100" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="장소나 메모를 입력하세요" />
          </div>
          {/* 시간 설정 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 ml-1">시작 시간</label>
              <input type="datetime-local" className="w-full mt-1.5 p-3 bg-slate-50 rounded-2xl text-[11px] font-black text-slate-900 border-none" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 ml-1">마감 시간</label>
              <input type="datetime-local" className="w-full mt-1.5 p-3 bg-slate-50 rounded-2xl text-[11px] font-black text-slate-900 border-none" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>
        <button onClick={handleAddTodo} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black text-base active:scale-95 transition-all shadow-lg shadow-slate-900/20">
          일정 추가하기
        </button>
      </section>

      {/* 리스트 목록 */}
      <div className="space-y-4 text-slate-900">
        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">My Plans ({todos.length})</h2>
        {todos.map(todo => (
          <div key={todo.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-white">
            <div className="flex justify-between items-start mb-2">
              <h3 className={`text-lg font-black text-slate-900 ${todo.is_completed ? 'line-through text-slate-300' : ''}`}>{todo.content}</h3>
              <input type="checkbox" checked={todo.is_completed} className="w-6 h-6 rounded-full border-slate-200 text-blue-600" onChange={async () => { await supabase.from("todos").update({ is_completed: !todo.is_completed }).eq("id", todo.id); fetchTodos(user.id); }} />
            </div>
            {todo.description && <p className="text-sm font-medium text-slate-500 mb-4 ml-1 leading-relaxed">{todo.description}</p>}
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">시작</span>
                <span className="text-slate-700">{new Date(todo.start_time).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="text-rose-500 bg-rose-50 px-2 py-0.5 rounded">마감</span>
                <span className="text-slate-700">{new Date(todo.end_time).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
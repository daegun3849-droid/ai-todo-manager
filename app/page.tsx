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
  const [rawInput, setRawInput] = useState(""); // AI에게 보낼 원문
  
  // 개별 입력 칸 상태
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUser(user); fetchTodos(user.id); }
    };
    checkUser();
  }, []);

  const fetchTodos = async (userId: string) => {
    const { data } = await supabase.from("todos").select("*").eq("user_id", userId).order("start_time", { ascending: true });
    if (data) setTodos(data);
  };

  // ✨ AI가 분석해서 각 칸에 채워주는 로직
  const handleAIAutoFill = async () => {
    if (!rawInput.trim()) return;
    setLoading(true);
    try {
      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        prompt: `텍스트: "${rawInput}" 에서 정보를 추출해 JSON으로 줘. 형식: { "title": "제목", "desc": "상세내용(장소 등)", "start": "YYYY-MM-DDTHH:mm", "end": "YYYY-MM-DDTHH:mm" }. 현재시간: ${new Date().toISOString()}`,
      });
      const res = JSON.parse(text.replace(/```json|```/g, ""));
      
      // 분석된 내용을 입력 칸에 자동 매칭
      setTitle(res.title || "");
      setDescription(res.desc || "");
      setStartTime(res.start?.slice(0, 16) || "");
      setEndTime(res.end?.slice(0, 16) || "");
    } catch (e) {
      alert("AI 분석에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 최종 DB 저장 로직
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
      // 입력창 초기화
      setTitle(""); setDescription(""); setStartTime(""); setEndTime(""); setRawInput("");
      fetchTodos(user.id);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F4F7FB] p-5 pb-20">
      <header className="flex justify-between items-center py-4 mb-4">
        <h1 className="text-2xl font-black text-slate-900">AI PLANNER</h1>
        <button onClick={() => supabase.auth.signOut().then(() => window.location.href="/login")} className="text-xs font-bold text-slate-400">로그아웃</button>
      </header>

      {/* 1단계: AI에게 말하기 */}
      <div className="bg-white rounded-3xl p-5 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">AI Quick Analysis</span>
          <button onClick={handleAIAutoFill} disabled={loading} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
            {loading ? "분석중..." : "✨ 자동완성"}
          </button>
        </div>
        <input 
          className="w-full p-3 bg-slate-50 rounded-xl text-sm outline-none border-none"
          placeholder="예: 내일 오후 2시 강남역 미팅"
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
        />
      </div>

      {/* 2단계: 상세 내용 확인 및 수정 */}
      <div className="bg-white rounded-3xl p-6 shadow-md mb-8 border border-blue-100">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 ml-1">제목</label>
            <input className="w-full mt-1 p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-800" value={title} onChange={e => setTitle(e.target.value)} placeholder="일정 제목" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 ml-1">상세 설명 (장소/메모)</label>
            <textarea className="w-full mt-1 p-3 bg-slate-50 rounded-xl text-sm text-slate-600" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="장소나 메모를 적어주세요" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 ml-1">시작 시간</label>
              <input type="datetime-local" className="w-full mt-1 p-3 bg-slate-50 rounded-xl text-[11px] font-bold" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 ml-1">마감 시간</label>
              <input type="datetime-local" className="w-full mt-1 p-3 bg-slate-50 rounded-xl text-[11px] font-bold" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        </div>
        <button onClick={handleAddTodo} className="w-full mt-6 bg-slate-900 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-slate-200">
          일정 추가하기
        </button>
      </div>

      {/* 리스트 목록 */}
      <div className="space-y-4">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-2">My Plans ({todos.length})</p>
        {todos.map(todo => (
          <div key={todo.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-white">
            <div className="flex justify-between items-start mb-2">
              <h3 className={`font-bold text-slate-800 ${todo.is_completed ? 'line-through text-slate-300' : ''}`}>{todo.content}</h3>
              <input type="checkbox" checked={todo.is_completed} className="w-5 h-5 rounded-full border-slate-200" onChange={async () => { await supabase.from("todos").update({ is_completed: !todo.is_completed }).eq("id", todo.id); fetchTodos(user.id); }} />
            </div>
            {todo.description && <p className="text-xs text-slate-500 mb-3 ml-1">{todo.description}</p>}
            <div className="flex gap-4 pt-3 border-t border-slate-50">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-500"><span>시작</span><span className="text-slate-700">{new Date(todo.start_time).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</span></div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400"><span>마감</span><span className="text-slate-700">{new Date(todo.end_time).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
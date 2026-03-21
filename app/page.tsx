"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import confetti from "canvas-confetti";
import Link from "next/link";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [todos, setTodos] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      await fetchTodos();
    };
    init();
  }, []);

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_date', { ascending: false });
    if (!error && data) setTodos(data);
    setLoading(false);
  };

  const progressPercent = todos.length > 0 ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100) : 0;

  const handleSaveTodo = async () => {
    if (inputValue.trim() === "") return;
    const todoData = {
      user_id: user?.id || null,
      title: inputValue,
      description: descriptionValue || null,
      created_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      completed: false
    };

    if (editingId) {
      await supabase.from('todos').update(todoData).eq('id', editingId);
      setEditingId(null);
    } else {
      await supabase.from('todos').insert([todoData]);
      confetti({ particleCount: 100, spread: 70 });
    }
    setInputValue(""); setDescriptionValue(""); setStartDate(""); setDueDate("");
    fetchTodos();
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await supabase.from('todos').update({ completed: !currentStatus }).eq('id', id);
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    if (!currentStatus) confetti({ particleCount: 50, spread: 50 });
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center font-black text-blue-500 text-2xl">데이터 동기화 중... 🚀</div>;

  return (
    <main className="flex min-h-screen flex-col items-center p-5 bg-[#F8FAFC]">
      {/* 🏷️ 제목 (어제 스타일) */}
      <h1 className="text-3xl font-black mb-6 text-slate-800 tracking-tight">
        ✨ AI로 내 계획 일정 서비스
      </h1>

      {/* 👤 환영 박스 (어제처럼 깔끔하게) */}
      <div className="w-full max-w-md mb-8">
        {user && (
          <div className="flex flex-col items-center p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 text-center">
            <p className="text-lg font-black text-slate-700">
              반갑습니다, <span className="text-blue-600 font-black">{user.email?.split('@')[0]}</span>님! 👋
            </p>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-[10px] text-slate-300 font-bold mt-2 underline">로그아웃</button>
          </div>
        )}
      </div>

      {/* 🚀 달성률 (어제의 그 파란 바) */}
      <div className="w-full max-w-md mb-8 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-end mb-3">
          <span className="text-sm font-black text-slate-700">오늘의 달성률 🚀</span>
          <span className="text-xs font-black text-blue-600">{progressPercent}% 완료</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* ➕ 입력창 (어제의 넉넉한 박스) */}
      <div className="w-full max-w-md bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-50 mb-10 space-y-4">
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="오늘 해치울 일은?" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xl outline-none" />
        <textarea value={descriptionValue} onChange={(e) => setDescriptionValue(e.target.value)} placeholder="상세 플랜을 적어보세요" className="w-full p-4 bg-slate-50 rounded-2xl text-sm h-24 resize-none outline-none" />
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
            <span className="text-xs font-black text-green-600">🟢 시작 일시</span>
            <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-sm font-bold outline-none" />
          </div>
          <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
            <span className="text-xs font-black text-red-500">🚨 마감 일시</span>
            <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-sm font-bold outline-none" />
          </div>
        </div>
        <button onClick={handleSaveTodo} className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all">일정 추가하기</button>
      </div>

      {/* 📋 리스트 영역 (어제의 그 스타일 + 큰 글씨 날짜) */}
      <div className="w-full max-w-md space-y-6">
        {todos.map((todo) => (
          <div key={todo.id} className={`p-6 rounded-[2.5rem] bg-white shadow-lg border border-slate-50 flex flex-col gap-4 relative transition-all ${todo.completed ? 'opacity-50' : ''}`}>
            {/* 우측 상단 아이콘 */}
            <div className="absolute top-6 right-6 flex items-center gap-3 text-slate-300">
              <button onClick={() => { setEditingId(todo.id); setInputValue(todo.title); window.scrollTo(0,0); }} className="hover:text-blue-500"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
              <button onClick={() => { if(confirm("삭제?")) supabase.from('todos').delete().eq('id', todo.id).then(() => fetchTodos()) }} className="hover:text-red-400"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>

            <div className="flex items-start gap-4 pr-12">
              <input type="checkbox" checked={todo.completed} onChange={() => handleToggle(todo.id, todo.completed)} className="w-6 h-6 mt-1 accent-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className={`font-black text-2xl tracking-tighter ${todo.completed ? 'line-through text-slate-300' : 'text-slate-800'}`}>{todo.title}</h3>
                {todo.description && (
                  <div className="text-[14px] text-blue-600 bg-blue-50/50 p-4 rounded-2xl mt-3 font-bold border border-blue-100/30">
                    {todo.description}
                  </div>
                )}
              </div>
            </div>
            
            {/* 시작/마감: 큼직하고 시원하게 한 줄씩 (한글) */}
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3 text-green-600 font-black text-[13px] bg-green-50/50 p-3 rounded-xl">
                <span className="w-12">🟢 시작</span>
                <span className="text-[15px]">{new Date(todo.created_date).toLocaleString('ko-KR', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
              </div>
              {todo.due_date && (
                <div className="flex items-center gap-3 text-red-500 font-black text-[13px] bg-red-50/50 p-3 rounded-xl">
                  <span className="w-12">🚨 마감</span>
                  <span className="text-[15px]">{new Date(todo.due_date).toLocaleString('ko-KR', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
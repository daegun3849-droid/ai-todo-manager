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
      confetti({ particleCount: 80, spread: 60 });
    }
    setInputValue(""); setDescriptionValue(""); setStartDate(""); setDueDate("");
    fetchTodos();
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await supabase.from('todos').update({ completed: !currentStatus }).eq('id', id);
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center font-bold text-slate-400">데이터 로딩 중...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-white text-slate-900">
      {/* 제목 및 유저 정보 */}
      <div className="w-full max-w-xl mb-6 text-center">
        <h1 className="text-2xl font-black mb-4 tracking-tight">✨ AI로 내 계획 일정 서비스</h1>
        {user && (
          <div className="py-4 border-y border-slate-100 bg-slate-50 rounded-2xl mb-4">
            <p className="text-lg font-black font-sans">반갑습니다, <span className="text-blue-600">{user.email?.split('@')[0]}</span>님!</p>
            <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())} className="text-xs text-slate-400 underline mt-1">로그아웃</button>
          </div>
        )}
      </div>

      {/* 달성률 */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex justify-between text-sm font-black mb-2 px-1">
          <span>오늘의 달성률</span>
          <span className="text-blue-600">{progressPercent}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full">
          <div className="h-full bg-slate-800 rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      {/* 입력 섹션: 가로 너비를 더 크게(max-w-xl) */}
      <div className="w-full max-w-xl border-2 border-slate-200 rounded-[2.5rem] p-6 mb-10 space-y-5 bg-white shadow-sm">
        <input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="오늘의 할 일을 입력하세요" 
          className="w-full p-3 text-xl font-black border-b-2 border-slate-100 outline-none focus:border-blue-500" 
        />
        <textarea 
          value={descriptionValue} 
          onChange={(e) => setDescriptionValue(e.target.value)} 
          placeholder="상세 내용을 적어주세요 (예: 위치를 잘 모르니 좀 일찍 가기)" 
          className="w-full p-3 text-base h-24 resize-none outline-none text-slate-600 bg-slate-50 rounded-xl font-bold" 
        />
        
        <div className="space-y-3">
          <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-sm font-black text-slate-400">시작 일시 (한글)</span>
            <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-lg font-black outline-none bg-transparent" />
          </div>
          <div className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-sm font-black text-blue-500">마감 일시 (한글)</span>
            <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="text-lg font-black outline-none bg-transparent" />
          </div>
        </div>
        <button onClick={handleSaveTodo} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl active:scale-95 transition-all shadow-lg">일정 등록하기</button>
      </div>

      {/* 리스트 섹션: 가로 너비를 입력창과 동일하게(max-w-xl) */}
      <div className="w-full max-w-xl space-y-6">
        {todos.map((todo) => (
          <div key={todo.id} className={`relative flex flex-col gap-4 p-6 rounded-[2rem] border border-slate-100 bg-white shadow-sm ${todo.completed ? 'opacity-40' : ''}`}>
            {/* 수정/삭제 아이콘 */}
            <div className="absolute top-6 right-6 flex gap-5 text-slate-300">
              <button onClick={() => { setEditingId(todo.id); setInputValue(todo.title); window.scrollTo(0,0); }} className="hover:text-blue-500"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
              <button onClick={() => { if(confirm("삭제하시겠습니까?")) supabase.from('todos').delete().eq('id', todo.id).then(() => fetchTodos()) }} className="hover:text-red-500"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>

            <div className="flex items-start gap-4 pr-14">
              <input type="checkbox" checked={todo.completed} onChange={() => handleToggle(todo.id, todo.completed)} className="w-7 h-7 mt-1 accent-slate-900 cursor-pointer flex-shrink-0" />
              <div className="w-full">
                <h3 className={`font-black text-2xl tracking-tighter ${todo.completed ? 'line-through' : ''}`}>{todo.title}</h3>
                {/* 상세내용 박스: 가로를 제목 너비와 꽉 맞춤 */}
                {todo.description && (
                  <div className="text-[15px] text-slate-600 bg-slate-50 p-4 rounded-xl mt-3 w-full font-bold leading-relaxed border border-slate-100">
                    {todo.description}
                  </div>
                )}
              </div>
            </div>

            {/* 시작/마감 일시: 한글 표기, 폰트 크기 대폭 확대(text-lg) */}
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 w-12">시작</span>
                <span className="text-lg font-black text-slate-700">
                  {new Date(todo.created_date).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {todo.due_date && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-blue-500 w-12">마감</span>
                  <span className="text-lg font-black text-blue-600">
                    {new Date(todo.due_date).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
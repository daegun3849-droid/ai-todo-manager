'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TodoPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUserEmail(session.user.email?.split('@')[0] || 'User');
      await fetchTodos();
    };
    init();
  }, [router]);

  async function fetchTodos() {
    try {
      const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) { console.error('불러오기 실패:', error.message); } 
    finally { setLoading(false); }
  }

  const addTodo = async () => {
    if (!title) return alert('제목을 입력해주세요!');
    
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('todos').insert([{
      title, content, start_time: startTime || null, end_time: endTime || null,
      user_id: session?.user.id, is_completed: false
    }]);

    if (error) {
      alert(`저장 실패: ${error.message}`);
    } else {
      setTitle(''); setContent(''); setStartTime(''); setEndTime('');
      await fetchTodos();
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id);
    if (!error) {
      // 폭죽 라이브러리가 없어도 에러 안 나게 처리
      try {
        const confetti = (await import('canvas-confetti')).default;
        if (!currentStatus) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      } catch (e) { console.log("폭죽 미설치"); }
      fetchTodos();
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex justify-between items-center px-6">
        <span className="text-xl font-black italic text-emerald-600">AI PLANNER</span>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="text-xs font-bold text-slate-400">로그아웃</button>
      </nav>
      <main className="mx-auto max-w-lg px-6 pt-10">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-[950] mb-5 tracking-tighter">AI로 계획을 다시 그려보세요</h1>
          <div className="inline-block bg-white px-5 py-2 rounded-full shadow-sm border border-slate-100 font-bold text-sm">반갑습니다, {userEmail}님! 👋</div>
        </header>

        <section className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-50 mb-12">
          <div className="space-y-5">
            <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="대제목: 해치울 일" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="상세플랜을 적으세요" className="w-full p-4 bg-slate-50 rounded-2xl border-none min-h-[100px] outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input type="datetime-local" value={startTime} onChange={(e)=>setStartTime(e.target.value)} className="p-3 bg-slate-50 rounded-xl text-[11px] font-bold" />
              <input type="datetime-local" value={endTime} onChange={(e)=>setEndTime(e.target.value)} className="p-3 bg-slate-50 rounded-xl text-[11px] font-bold text-rose-500" />
            </div>
            <button onClick={addTodo} className="w-full py-5 bg-slate-900 text-white rounded-[22px] font-black text-lg active:scale-95 transition-all hover:bg-emerald-600 shadow-xl">일정 추가하기</button>
          </div>
        </section>

        <div className="space-y-6">
          {todos.map((todo) => (
            <div key={todo.id} className={`group bg-white p-7 rounded-[38px] border transition-all ${todo.is_completed ? 'opacity-60' : 'shadow-md hover:border-emerald-200'}`}>
              <div className="flex items-start gap-4">
                <button onClick={() => toggleComplete(todo.id, todo.is_completed)} className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${todo.is_completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white'}`}>
                  {todo.is_completed && <span className="font-bold">✓</span>}
                </button>
                <div className="flex-1">
                  <h4 className={`text-xl font-black ${todo.is_completed ? 'line-through text-slate-400' : ''}`}>{todo.title}</h4>
                  <p className="text-sm text-slate-400 mt-1">{todo.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TodoPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUserEmail(session.user.email?.split('@')[0] || 'User');
      await fetchTodos();
    };
    init();
  }, [router]);

  async function fetchTodos() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ 1. 체크박스 기능 (상태 실시간 반영)
  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id);
    if (!error) {
      setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
    }
  };

  // ✅ 2. 삭제 기능 (휴지통)
  const deleteTodo = async (id: string) => {
    if (!confirm('이 계획을 삭제할까요?')) return;
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) setTodos(todos.filter(t => t.id !== id));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '미지정';
    const d = new Date(dateStr);
    return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-20 font-sans text-slate-900">
      {/* GNB */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <span className="text-xl font-black tracking-tighter text-emerald-600">AI PLANNER</span>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors">LOGOUT</button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pt-12">
        {/* 대제목 & 소제목 섹션 */}
        <header className="mb-12 text-center md:text-left">
          <h1 className="mb-4 text-3xl font-[950] leading-[1.1] tracking-[ -0.05em] md:text-5xl">
            AI로 계획을 다시 그려보세요
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-emerald-700">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span></span>
            <p className="text-sm font-black">반갑습니다, {userEmail}님!</p>
          </div>
        </header>

        {/* 메인 입력 카드 */}
        <section className="mb-16 overflow-hidden rounded-[40px] border border-slate-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
          <div className="p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">오늘의 새로운 계획</h2>
              <p className="text-sm font-bold text-emerald-500">해치울 일</p>
            </div>
            
            <div className="space-y-6">
              <textarea 
                placeholder="상세플랜을 적으세요"
                className="min-h-[140px] w-full resize-none rounded-3xl bg-slate-50 p-6 text-base font-medium outline-none transition-all focus:ring-2 focus:ring-emerald-500/10 placeholder:text-slate-300"
              />
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-transparent hover:border-emerald-200 cursor-pointer transition-all">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm text-lg">🟢</div>
                  <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start</span><span className="text-sm font-bold text-slate-700">시작 시간 설정</span></div>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-transparent hover:border-rose-200 cursor-pointer transition-all">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm text-lg">🚨</div>
                  <div className="flex flex-col"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End</span><span className="text-sm font-bold text-slate-700">마감 시간 설정</span></div>
                </div>
              </div>

              <button className="w-full rounded-2xl bg-slate-900 py-5 text-lg font-black text-white shadow-2xl shadow-slate-200 transition-all hover:bg-emerald-600 active:scale-[0.98]">
                AI 일정 스마트 생성하기
              </button>
            </div>
          </div>
        </section>

        {/* 리스트 섹션 */}
        <section className="space-y-6">
          <div className="flex items-end justify-between px-2">
            <h3 className="text-xl font-black tracking-tight text-slate-800">내 계획 리스트 <span className="text-emerald-500 ml-1">{todos.length}</span></h3>
          </div>

          <div className="grid gap-5">
            {todos.length === 0 ? (
              <div className="rounded-[40px] border-2 border-dashed border-slate-100 bg-white py-20 text-center"><p className="font-bold text-slate-300">텅 비어있네요. 새로운 계획을 그려보세요!</p></div>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} className={`group relative overflow-hidden rounded-[32px] border bg-white p-6 transition-all md:p-8 ${todo.is_completed ? 'border-slate-50 bg-slate-50/50 opacity-60' : 'border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-xl'}`}>
                  <div className="flex items-start gap-6">
                    {/* ✅ 세련된 대형 체크박스 */}
                    <button 
                      onClick={() => toggleComplete(todo.id, todo.is_completed)}
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${todo.is_completed ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'border-slate-200 bg-white hover:border-emerald-400'}`}
                    >
                      {todo.is_completed && <span className="text-lg font-bold">✓</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      <h4 className={`mb-2 text-xl font-bold tracking-tight text-slate-800 ${todo.is_completed ? 'line-through text-slate-400' : ''}`}>
                        {todo.title}
                      </h4>
                      <p className="mb-6 text-sm font-medium leading-relaxed text-slate-400 line-clamp-2">{todo.content}</p>
                      
                      {/* ✅ 큼직하고 편안한 시간 표시 배지 */}
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700 border border-emerald-100/50">
                          <span className="text-[10px] font-black uppercase tracking-tighter">Start</span>
                          <span className="text-xs font-black">{formatDate(todo.start_time || todo.start_at)}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-rose-700 border border-rose-100/50">
                          <span className="text-[10px] font-black uppercase tracking-tighter">End</span>
                          <span className="text-xs font-black">{formatDate(todo.end_time || todo.end_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* ✅ 수정 & 삭제 액션 그룹 */}
                    <div className="flex flex-col gap-2 md:flex-row opacity-0 group-hover:opacity-100 transition-all">
                      <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-white hover:text-emerald-500 hover:shadow-md transition-all">✏️</button>
                      <button onClick={() => deleteTodo(todo.id)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:shadow-md transition-all">🗑️</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
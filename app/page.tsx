'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TodoPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  
  // 폼 입력 상태 (제목과 상세내용 분리)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

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

  // 1. 데이터 불러오기 (에러 방지를 위해 정렬 없이 전체 호출)
  async function fetchTodos() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('todos').select('*');
      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) {
      console.error('Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // 2. 로그아웃 기능
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // 3. 일정 추가 기능 (제목 + 상세플랜)
  const addTodo = async () => {
    if (!title) return alert('해치울 일(제목)을 입력해주세요!');
    const { data: { session } } = await supabase.auth.getSession();
    
    const { error } = await supabase.from('todos').insert([{
      title,
      content,
      start_time: startTime || null,
      end_time: endTime || null,
      user_id: session?.user.id,
      is_completed: false
    }]);

    if (!error) {
      setTitle(''); setContent(''); setStartTime(''); setEndTime('');
      fetchTodos();
    }
  };

  // 4. 체크박스 토글 (실시간 완료 체크)
  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id);
    if (!error) fetchTodos();
  };

  // 5. 삭제 기능 (휴지통)
  const deleteTodo = async (id: string) => {
    if (!confirm('이 계획을 삭제할까요?')) return;
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) fetchTodos();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '미정';
    const d = new Date(dateStr);
    return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
    </div>
  );

  const progress = todos.length > 0 ? Math.round((todos.filter(t => t.is_completed).length / todos.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans text-slate-900">
      {/* GNB */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-6">
          <span className="text-xl font-black tracking-tighter text-emerald-600 italic">AI PLANNER</span>
          <button onClick={handleLogout} className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-rose-500 transition-all">로그아웃</button>
        </div>
      </nav>

      <main className="mx-auto max-w-lg px-6 pt-10">
        {/* 헤더 */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-[950] tracking-tighter mb-4 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
            AI로 계획을 다시 그려보세요
          </h1>
          <div className="inline-block bg-white px-5 py-2 rounded-full shadow-sm border border-slate-100">
            <p className="text-sm font-bold text-slate-700">반갑습니다, <span className="text-emerald-600">{userEmail}님!</span> 👊</p>
          </div>
        </header>

        {/* 달성률 배지 */}
        <div className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-black text-slate-400 uppercase">Today's Goal</span>
            <span className="text-xs font-black text-emerald-600">{progress}% Done</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* 입력 카드 */}
        <section className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-50 mb-12">
          <h2 className="text-2xl font-[900] tracking-tight text-slate-800 mb-6 italic underline decoration-emerald-200 underline-offset-8">오늘의 새로운 계획</h2>
          
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">해치울 일 (제목)</label>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="제목을 입력하세요" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase tracking-widest">상세 플랜을 적으세요</label>
              <textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="상세 내용을 적어보세요" className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm min-h-[120px] outline-none resize-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-black text-emerald-600 block mb-1 ml-1">START</span>
                <input type="datetime-local" value={startTime} onChange={(e)=>setStartTime(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[11px] font-bold border-none outline-none" />
              </div>
              <div>
                <span className="text-[10px] font-black text-rose-600 block mb-1 ml-1">END</span>
                <input type="datetime-local" value={endTime} onChange={(e)=>setEndTime(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl text-[11px] font-bold border-none outline-none text-rose-500" />
              </div>
            </div>

            <button onClick={addTodo} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-base shadow-xl active:scale-[0.98] transition-all hover:bg-emerald-600">일정 생성하기</button>
          </div>
        </section>

        {/* 리스트 섹션 */}
        <div className="space-y-5">
          <h3 className="text-xl font-black px-2 mb-4">내 계획 리스트 <span className="text-emerald-500">{todos.length}</span></h3>
          {todos.length === 0 ? (
            <div className="py-20 text-center font-bold text-slate-300 bg-white rounded-[32px] border border-dashed border-slate-200">새로운 계획을 그려보세요!</div>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className={`group bg-white p-6 rounded-[32px] border transition-all ${todo.is_completed ? 'bg-slate-50 opacity-60 border-slate-100' : 'shadow-md border-white hover:border-emerald-200'}`}>
                <div className="flex items-start gap-4">
                  {/* 체크박스 */}
                  <button onClick={() => toggleComplete(todo.id, todo.is_completed)} className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${todo.is_completed ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'border-slate-200 bg-white hover:border-emerald-400'}`}>
                    {todo.is_completed && <span className="text-lg font-bold">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`text-xl font-[900] tracking-tight text-slate-800 ${todo.is_completed ? 'line-through text-slate-400' : ''}`}>{todo.title}</h3>
                      <button onClick={()=>deleteTodo(todo.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all">🗑️</button>
                    </div>
                    {todo.content && <p className="text-sm font-medium text-slate-400 mb-5 leading-relaxed">{todo.content}</p>}
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between bg-emerald-50/50 px-3 py-2 rounded-xl border border-emerald-100/50">
                        <span className="text-[10px] font-black text-emerald-600 shrink-0">🟢 시작</span>
                        <span className="text-[11px] font-bold text-emerald-900">{formatDate(todo.start_time || todo.start_at)}</span>
                      </div>
                      <div className="flex items-center justify-between bg-rose-50/50 px-3 py-2 rounded-xl border border-rose-100/50">
                        <span className="text-[10px] font-black text-rose-600 shrink-0">🚨 마감</span>
                        <span className="text-[11px] font-bold text-rose-900">{formatDate(todo.end_time || todo.end_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
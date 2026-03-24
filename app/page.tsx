'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TodoPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  
  // 입력 폼 상태
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

  // 1. 데이터 불러오기
  async function fetchTodos() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  // 2. 일정 추가 기능
  const addTodo = async () => {
    if (!title) return alert('할 일을 입력해주세요!');
    
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

  // 3. 체크박스 토글 (완료/미완료)
  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !currentStatus })
      .eq('id', id);
    if (!error) fetchTodos();
  };

  // 4. 삭제 기능 (휴지통)
  const deleteTodo = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) fetchTodos();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '미지정';
    const d = new Date(dateStr);
    return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans text-slate-900">
      {/* GNB */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-6">
          <span className="text-xl font-black tracking-tighter text-emerald-600">✨ AI PLANNER</span>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="text-xs font-bold text-slate-400">로그아웃</button>
        </div>
      </nav>

      <main className="mx-auto max-w-lg px-6 pt-10">
        {/* 상단 인삿말 및 대제목 */}
        <header className="mb-10 text-center">
          <div className="inline-block bg-white px-6 py-3 rounded-full shadow-sm border border-slate-100 mb-4">
            <p className="text-sm font-bold text-slate-800">
              반갑습니다, <span className="text-emerald-600">{userEmail}님!</span> 👊
            </p>
          </div>
          <h1 className="text-3xl font-[950] tracking-tighter leading-tight">
            AI로 계획을 다시 그려보세요
          </h1>
        </header>

        {/* 달성률 배지 (샘플 디자인 반영) */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8 flex justify-between items-center">
          <span className="text-xs font-black text-slate-800">오늘의 달성률 🚀</span>
          <span className="text-xs font-black text-emerald-600">
            {todos.length > 0 ? Math.round((todos.filter(t => t.is_completed).length / todos.length) * 100) : 0}% 완료
          </span>
        </div>

        {/* 1. 입력 섹션: 해치울 일 & 상세 플랜 */}
        <section className="bg-white p-6 rounded-[35px] shadow-xl border border-slate-50 mb-12">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-400 ml-1 mb-2 block uppercase tracking-widest">오늘 해치울 일은?</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 ml-1 mb-2 block uppercase tracking-widest">상세 플랜을 적으세요</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="어떻게 해치울 건가요?"
                className="w-full p-4 bg-slate-50 rounded-2xl border-none text-sm min-h-[100px] outline-none resize-none"
              />
            </div>
            
            {/* 시간 설정 버튼/인풋 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="text-[10px] font-black text-emerald-600 ml-1 mb-1 block">🟢 시작</label>
                <input 
                  type="datetime-local" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border-none text-[11px] font-bold outline-none"
                />
              </div>
              <div className="relative">
                <label className="text-[10px] font-black text-rose-600 ml-1 mb-1 block">🚨 마감</label>
                <input 
                  type="datetime-local" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border-none text-[11px] font-bold outline-none"
                />
              </div>
            </div>

            <button 
              onClick={addTodo}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all hover:bg-emerald-600"
            >
              일정 추가하기
            </button>
          </div>
        </section>

        {/* 2. 할 일 리스트 (샘플 디자인 100% 반영) */}
        <div className="space-y-5">
          {todos.length === 0 ? (
            <div className="py-20 text-center font-bold text-slate-300">텅 비어있네요. 계획을 추가해보세요!</div>
          ) : (
            todos.map((todo) => (
              <div key={todo.id} className={`group bg-white p-6 rounded-[32px] border transition-all ${todo.is_completed ? 'border-slate-50 bg-slate-50/50 opacity-60' : 'border-slate-100 shadow-md hover:border-emerald-200'}`}>
                <div className="flex items-start gap-4">
                  {/* 체크박스 */}
                  <button 
                    onClick={() => toggleComplete(todo.id, todo.is_completed)}
                    className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${todo.is_completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white hover:border-emerald-400'}`}
                  >
                    {todo.is_completed && <span className="text-sm font-bold">✓</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`text-xl font-[900] tracking-tight text-slate-800 ${todo.is_completed ? 'line-through text-slate-400' : ''}`}>
                        {todo.title}
                      </h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 hover:bg-slate-100 rounded-lg text-xs">✏️</button>
                        <button onClick={() => deleteTodo(todo.id)} className="p-1 hover:bg-rose-50 rounded-lg text-xs text-rose-500">🗑️</button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-400 mb-5 leading-relaxed">{todo.content}</p>
                    
                    {/* 시간 표시 배지 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 bg-emerald-50/50 px-3 py-2 rounded-xl border border-emerald-100/50">
                        <span className="text-[10px] font-black text-emerald-600 shrink-0">🟢 시작</span>
                        <span className="text-[11px] font-bold text-emerald-900">{formatDate(todo.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-rose-50/50 px-3 py-2 rounded-xl border border-rose-100/50">
                        <span className="text-[10px] font-black text-rose-600 shrink-0">🚨 마감</span>
                        <span className="text-[11px] font-bold text-rose-900">{formatDate(todo.end_time)}</span>
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
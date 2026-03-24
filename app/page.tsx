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
      const email = session.user.email || '';
      setUserEmail(email.split('@')[0]);
      await fetchTodos();
    };
    init();
  }, [router]);

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

  // 완료 상태 토글 함수 (체크박스 클릭 시)
  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !currentStatus })
      .eq('id', id);
    if (!error) fetchTodos();
  };

  const formatDate = (todo: any, type: 'start' | 'end') => {
    const dateStr = type === 'start' 
      ? (todo.start_time || todo.start_at) 
      : (todo.end_time || todo.end_at || todo.due_date);

    if (!dateStr) return '시간 미지정';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '시간 미지정';

    return d.toLocaleString('ko-KR', { 
      month: 'numeric', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', 
      hour12: false 
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-5 bg-gray-50 min-h-screen pb-24 text-gray-900 font-sans">
      {/* 1. 상단 인삿말 섹션 */}
      <header className="mb-8 pt-8 px-1">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-emerald-600 font-extrabold text-sm tracking-tight">반갑습니다, {userEmail}님! 👋</p>
            <h1 className="text-2xl font-[900] tracking-tighter text-gray-900 leading-[1.2]">
              AI로 계획을<br />다시 그려보세요
            </h1>
          </div>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-400 shadow-sm"
          >로그아웃</button>
        </div>
      </header>

      {/* 2. 입력 카드 (Input) */}
      <div className="bg-white p-6 rounded-[35px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 mb-10">
        <p className="text-sm font-black text-gray-800 mb-4 ml-1">오늘의 새로운 계획</p>
        <textarea 
          placeholder="여기에 할 일을 자유롭게 입력하세요..."
          className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none mb-4 min-h-[110px] placeholder:text-gray-300"
        />
        
        {/* 날짜 선택 (모바일 겹침 방지 레이아웃) */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex flex-col items-center justify-center gap-1 bg-gray-50/80 p-3 rounded-2xl border border-gray-100 cursor-pointer">
            <span className="text-[10px] font-black text-emerald-600 uppercase">Start</span>
            <span className="text-[11px] font-bold text-gray-400">시작 일시</span>
          </div>
          <div className="flex flex-col items-center justify-center gap-1 bg-gray-50/80 p-3 rounded-2xl border border-gray-100 cursor-pointer">
            <span className="text-[10px] font-black text-rose-600 uppercase">Deadline</span>
            <span className="text-[11px] font-bold text-gray-400">마감 일시</span>
          </div>
        </div>

        <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all">
          AI 일정 생성하기
        </button>
      </div>

      {/* 3. 할 일 리스트 (List) */}
      <div className="px-1 mb-5 flex justify-between items-end">
        <h2 className="font-black text-gray-900 text-xl tracking-tighter">내 계획 리스트</h2>
        <span className="text-[11px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
          {todos.filter(t => !t.is_completed).length}개 남음
        </span>
      </div>

      <div className="space-y-4">
        {todos.length === 0 ? (
          <div className="text-center py-24 text-gray-300 text-sm font-medium bg-white rounded-[35px] border border-dashed border-gray-200">
            아직 계획된 일정이 없어요.
          </div>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className={`group bg-white p-5 rounded-[30px] shadow-sm border transition-all ${todo.is_completed ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-emerald-200 hover:shadow-md'}`}>
              <div className="flex items-start gap-3">
                {/* 🔴 체크박스 박스 */}
                <div 
                  onClick={() => toggleComplete(todo.id, todo.is_completed)}
                  className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all shrink-0 ${todo.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 bg-white'}`}
                >
                  {todo.is_completed && <span className="text-white text-xs">✓</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold text-gray-800 text-lg leading-tight break-all ${todo.is_completed ? 'line-through text-gray-400' : ''}`}>
                      {todo.title}
                    </h3>
                  </div>
                  {todo.content && (
                    <p className="text-gray-400 text-xs mb-4 line-clamp-1">{todo.content}</p>
                  )}
                  
                  {/* 시간 정보 영역 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-gray-400">시작</span>
                      <span className="text-gray-600">{formatDate(todo, 'start')}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-gray-400">마감</span>
                      <span className="text-rose-500">{formatDate(todo, 'end')}</span>
                    </div>
                  </div>
                </div>

                <button className="text-gray-200 hover:text-rose-400 transition-colors ml-2 shrink-0">
                  <span className="text-[10px]">🗑️</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
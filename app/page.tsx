'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TodoPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      await fetchTodos();
    };
    init();
  }, [router]);

  async function fetchTodos() {
    try {
      setLoading(true);
      // [DB 에러 해결] created_at 컬럼이 없으므로 order를 빼고 가져옵니다.
      const { data, error } = await supabase
        .from('todos')
        .select('*');

      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) {
      console.error('Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '미지정';
    const d = new Date(dateStr);
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
    <div className="max-w-md mx-auto p-4 bg-gray-50 min-h-screen pb-24 text-gray-900">
      <header className="flex justify-between items-center mb-8 pt-4 px-2">
        <h1 className="text-xl font-black tracking-tight">✨ AI 일정 관리</h1>
        <button 
          onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
          className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-500 shadow-sm"
        >로그아웃</button>
      </header>

      <div className="space-y-4">
        {todos.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm font-medium bg-white rounded-[28px] border border-dashed border-gray-200">
            등록된 일정이 없습니다.
          </div>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-gray-800 text-lg leading-tight break-all">{todo.title}</h3>
                {todo.is_completed && (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded-full font-black ml-2 shrink-0">완료</span>
                )}
              </div>
              <p className="text-gray-500 text-xs mb-5 line-clamp-2 leading-relaxed">{todo.content}</p>
              
              {/* 모바일 최적화: 가로가 아닌 '세로'로 배치하여 절대 깨짐 방지 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100/30">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs">🟢</span>
                    <span className="text-[11px] font-black text-emerald-700">시작</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-900">{formatDate(todo.start_time)}</span>
                </div>

                <div className="flex items-center justify-between bg-rose-50/70 p-3 rounded-2xl border border-rose-100/30">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs">🚨</span>
                    <span className="text-[11px] font-black text-rose-700">마감</span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-900">{formatDate(todo.end_time)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
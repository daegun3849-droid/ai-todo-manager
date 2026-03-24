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
      // created_at 에러 방지를 위해 정렬 없이 전체 데이터 호출
      const { data, error } = await supabase.from('todos').select('*');
      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) {
      console.error('Fetch Error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // [수정] 데이터베이스 컬럼명이 달라도 날짜를 찾아내는 똑똑한 함수
  const formatDate = (todo: any, type: 'start' | 'end') => {
    // DB 컬럼명이 start_time일 수도 있고 start_at일 수도 있어서 둘 다 체크합니다.
    const dateStr = type === 'start' 
      ? (todo.start_time || todo.start_at) 
      : (todo.end_time || todo.end_at || todo.due_date);

    if (!dateStr) return '미지정';
    
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '미지정'; // 날짜 형식이 아닐 경우

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
    <div className="max-w-md mx-auto p-4 bg-gray-50 min-h-screen pb-24 text-gray-900 font-sans">
      {/* 1. 헤더 */}
      <header className="flex justify-between items-center mb-6 pt-4">
        <h1 className="text-xl font-black tracking-tighter text-gray-900">✨ AI 내 계획 일정</h1>
        <button 
          onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
          className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-500 shadow-sm active:scale-95 transition-all"
        >로그아웃</button>
      </header>

      {/* 2. 상단 입력창 (모바일에서 절대 안 깨지게 수정) */}
      <div className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 mb-8">
        <p className="text-sm font-bold text-gray-800 mb-4">오늘 해치울 일은?</p>
        <textarea 
          placeholder="오늘 할 일을 입력해 보세요"
          className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none mb-4"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button className="flex items-center justify-center gap-2 bg-emerald-50 p-3 rounded-xl border border-emerald-100 shrink-0">
            <span className="text-xs">🟢</span>
            <span className="text-[11px] font-black text-emerald-700 whitespace-nowrap">시작 일시</span>
          </button>
          <button className="flex items-center justify-center gap-2 bg-rose-50 p-3 rounded-xl border border-rose-100 shrink-0">
            <span className="text-xs">🚨</span>
            <span className="text-[11px] font-black text-rose-700 whitespace-nowrap">마감 일시</span>
          </button>
        </div>
        <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-lg active:scale-[0.98] transition-transform">
          일정 추가하기
        </button>
      </div>

      {/* 3. 일정 리스트 */}
      <div className="space-y-4">
        {todos.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm font-medium bg-white rounded-[28px] border border-dashed border-gray-200">
            등록된 일정이 없습니다.
          </div>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 text-lg leading-tight break-all">{todo.title}</h3>
                <div className="flex gap-2">
                  <button className="text-gray-300 text-xs">✏️</button>
                  <button className="text-gray-300 text-xs">🗑️</button>
                </div>
              </div>
              
              {/* 모바일 최적화: 세로로 쌓기 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-emerald-50/70 p-3 rounded-2xl">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs">🟢 시작</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-900">{formatDate(todo, 'start')}</span>
                </div>

                <div className="flex items-center justify-between bg-rose-50/70 p-3 rounded-2xl">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs">🚨 마감</span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-900">{formatDate(todo, 'end')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
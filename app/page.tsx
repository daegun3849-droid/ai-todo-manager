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
      // 이메일에서 @ 앞부분(아이디)만 가져오기
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

  const formatDate = (todo: any, type: 'start' | 'end') => {
    const dateStr = type === 'start' 
      ? (todo.start_time || todo.start_at) 
      : (todo.end_time || todo.end_at || todo.due_date);

    if (!dateStr) return '미지정';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '미지정';

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
      {/* 1. 환영 헤더 */}
      <header className="mb-8 pt-6 px-2">
        <div className="flex justify-between items-start mb-2">
          <div className="space-y-1">
            <p className="text-emerald-600 font-bold text-sm">반갑습니다, {userEmail}님! 👋</p>
            <h1 className="text-2xl font-black tracking-tighter text-gray-900">
              AI 재 계획 <br/>일정 서비스
            </h1>
          </div>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-400 shadow-sm active:scale-95"
          >로그아웃</button>
        </div>
      </header>

      {/* 2. 상단 입력 카드 (모바일 최적화) */}
      <div className="bg-white p-6 rounded-[32px] shadow-md border border-gray-50 mb-10">
        <p className="text-sm font-black text-gray-800 mb-4">어떤 계획을 재구성해볼까요?</p>
        <textarea 
          placeholder="여기에 할 일을 입력하세요..."
          className="w-full p-4 bg-gray-50 rounded-2xl border-none text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none mb-4 min-h-[100px]"
        />
        
        {/* 날짜 선택 버튼 그룹 - 모바일에서 겹치지 않게 grid 유지 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button className="flex flex-col items-center justify-center gap-1 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50 active:bg-emerald-100 transition-colors">
            <span className="text-xs">🟢</span>
            <span className="text-[11px] font-black text-emerald-700">시작 일시</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-1 bg-rose-50/50 p-3 rounded-2xl border border-rose-100/50 active:bg-rose-100 transition-colors">
            <span className="text-xs">🚨</span>
            <span className="text-[11px] font-black text-rose-700">마감 일시</span>
          </button>
        </div>

        <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-base shadow-xl active:scale-[0.97] transition-all">
          AI 일정 생성하기
        </button>
      </div>

      {/* 3. 할 일 목록 리스트 */}
      <div className="px-1 mb-4 flex justify-between items-center">
        <h2 className="font-black text-gray-900 text-lg">내 계획 리스트</h2>
        <span className="text-[10px] font-bold text-gray-400">총 {todos.length}개</span>
      </div>

      <div className="space-y-4">
        {todos.length === 0 ? (
          <div className="text-center py-20 text-gray-300 text-sm font-medium bg-white rounded-[32px] border border-dashed border-gray-200">
            아직 생성된 일정이 없습니다.
          </div>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 text-lg leading-tight break-all pr-4">{todo.title}</h3>
                <div className="flex gap-1 shrink-0">
                  <button className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-xs">✏️</button>
                  <button className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-xs">🗑️</button>
                </div>
              </div>
              
              {/* 시간 정보 섹션 - 세로 배치로 절대 안 깨짐 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-emerald-50/40 p-3 rounded-2xl">
                  <span className="text-[11px] font-black text-emerald-600 shrink-0">시작 일시</span>
                  <span className="text-[11px] font-bold text-emerald-900">{formatDate(todo, 'start')}</span>
                </div>
                <div className="flex items-center justify-between bg-rose-50/40 p-3 rounded-2xl">
                  <span className="text-[11px] font-black text-rose-600 shrink-0">마감 일시</span>
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
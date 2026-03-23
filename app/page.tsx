'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TodoPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  // 날짜 포맷 함수
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '미지정';
    const d = new Date(dateStr);
    return d.toLocaleString('ko-KR', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">✨ AI 일정 관리</h1>
        <button 
          onClick={() => { supabase.auth.signOut(); router.push('/login'); }}
          className="text-sm text-gray-500"
        >로그아웃</button>
      </header>

      <div className="space-y-4">
        {todos.map((todo) => (
          <div key={todo.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-2">{todo.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{todo.content}</p>
            
            {/* 모바일 글자 깨짐 방지 핵심 구간 */}
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between bg-emerald-50/50 p-2 rounded-lg text-xs sm:text-sm">
                <span className="font-bold text-emerald-700 whitespace-nowrap mr-2">🟢 시작</span>
                <span className="text-gray-600 truncate">{formatDate(todo.start_time)}</span>
              </div>
              <div className="flex items-center justify-between bg-rose-50/50 p-2 rounded-lg text-xs sm:text-sm">
                <span className="font-bold text-rose-700 whitespace-nowrap mr-2">🚨 마감</span>
                <span className="text-gray-600 truncate">{formatDate(todo.end_time)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
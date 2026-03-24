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
      const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTodos(data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '미지정';
    const d = new Date(dateStr);
    return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-50 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">✨ AI 일정 관리</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push('/login'); }} className="text-xs text-gray-500">로그아웃</button>
      </header>
      <div className="space-y-4">
        {todos.map((todo) => (
          <div key={todo.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-sm mb-1">{todo.title}</h3>
            <p className="text-gray-500 text-xs mb-3">{todo.content}</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between bg-emerald-50 p-2 rounded-lg">
                <span className="text-[10px] font-bold text-emerald-700 shrink-0">🟢 시작</span>
                <span className="text-[10px] text-gray-600 whitespace-nowrap">{formatDate(todo.start_time)}</span>
              </div>
              <div className="flex items-center justify-between bg-rose-50 p-2 rounded-lg">
                <span className="text-[10px] font-bold text-rose-700 shrink-0">🚨 마감</span>
                <span className="text-[10px] text-gray-600 whitespace-nowrap">{formatDate(todo.end_time)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
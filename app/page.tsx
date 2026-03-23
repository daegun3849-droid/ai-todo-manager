'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Calendar, Clock, CheckCircle2, Circle, Trash2, Edit2, Plus, LogOut } from 'lucide-react';

export default function Home() {
  const [todos, setTodos] = useState<any[]>([]);
  const [task, setTask] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchTodos();
    };
    getUser();
  }, []);

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setTodos(data);
  };

  const addTodo = async () => {
    if (!task) return;
    const { error } = await supabase.from('todos').insert([{
      task,
      description,
      start_date: startDate || null,
      due_date: endDate || null,
      user_id: user?.id
    }]);
    if (!error) {
      setTask('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      fetchTodos();
    }
  };

  const toggleTodo = async (id: string, is_completed: boolean) => {
    await supabase.from('todos').update({ is_completed: !is_completed }).eq('id', id);
    fetchTodos();
  };

  const deleteTodo = async (id: string) => {
    await supabase.from('todos').delete().eq('id', id);
    fetchTodos();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* 상단 헤더 */}
      <div className="max-w-md mx-auto bg-white p-6 rounded-b-3xl shadow-sm border-b border-slate-100 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            ✨ AI로 내 계획 일정 서비스
          </h1>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
        
        {user && (
          <div className="bg-blue-50 p-4 rounded-2xl mb-6 border border-blue-100">
            <p className="text-sm text-blue-600 font-medium text-center">
              반갑습니다, <span className="text-blue-800 font-bold">{user.email?.split('@')[0]}</span>님! 👋
            </p>
          </div>
        )}

        {/* 입력 섹션 */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <input
            type="text"
            placeholder="오늘 해치울 일은?"
            className="w-full p-4 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
          <textarea
            placeholder="상세 플랜을 적어보세요"
            className="w-full p-4 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-blue-500 text-sm text-slate-600 min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm">
              <span className="text-sm font-bold text-green-700 whitespace-nowrap min-w-fit">🟢 시작</span>
              <input
                type="datetime-local"
                className="w-full border-none p-0 text-sm text-slate-600 focus:ring-0"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm">
              <span className="text-sm font-bold text-red-700 whitespace-nowrap min-w-fit">🚨 마감</span>
              <input
                type="datetime-local"
                className="w-full border-none p-0 text-sm text-slate-600 focus:ring-0"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={addTodo}
            className="w-full bg-slate-800 text-white p-4 rounded-xl font-bold hover:bg-slate-900 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
          >
            <Plus size={20} /> 일정 추가하기
          </button>
        </div>
      </div>

      {/* 리스트 섹션 */}
      <div className="max-w-md mx-auto px-4 space-y-4">
        {todos.map((todo) => (
          <div key={todo.id} className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all ${todo.is_completed ? 'opacity-60 bg-slate-50' : ''}`}>
            <div className="flex items-start gap-4 mb-4">
              <button onClick={() => toggleTodo(todo.id, todo.is_completed)} className="mt-1 transition-transform active:scale-125">
                {todo.is_completed ? (
                  <CheckCircle2 className="text-blue-500" size={24} />
                ) : (
                  <Circle className="text-slate-300" size={24} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-lg leading-tight truncate ${todo.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {todo.task}
                </h3>
                {todo.description && (
                  <p className="text-slate-500 text-sm mt-1 line-clamp-2">{todo.description}</p>
                )}
              </div>
              <button onClick={() => deleteTodo(todo.id)} className="text-slate-300 hover:text-red-400 p-1">
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-slate-50">
              {todo.start_date && (
                <div className="flex items-center gap-3 px-3 py-2 bg-green-50 rounded-xl border border-green-100/50">
                  <span className="text-[13px] font-bold text-green-700 whitespace-nowrap min-w-fit">🟢 시작</span>
                  <span className="text-[14px] text-slate-600 font-medium">
                    {new Date(todo.start_date).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {todo.due_date && (
                <div className="flex items-center gap-3 px-3 py-2 bg-red-50 rounded-xl border border-red-100/50">
                  <span className="text-[13px] font-bold text-red-700 whitespace-nowrap min-w-fit">🚨 마감</span>
                  <span className="text-[14px] text-slate-600 font-medium">
                    {new Date(todo.due_date).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
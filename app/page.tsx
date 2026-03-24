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
      setUserEmail(session.user.email?.split('@')[0] || '사용자');
      await fetchTodos();
    };
    init();
  }, [router]);

  // 데이터 가져오기
  async function fetchTodos() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('todos').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // 1. 체크박스 상태 변경 (DB 업데이트)
  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: !currentStatus })
      .eq('id', id);
    if (!error) {
      setTodos(todos.map(t => t.id === id ? { ...t, is_completed: !currentStatus } : t));
    }
  };

  // 2. 삭제 기능 (DB 삭제)
  const deleteTodo = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) {
      setTodos(todos.filter(t => t.id !== id));
    }
  };

  const formatDate = (todo: any, type: 'start' | 'end') => {
    const dateStr = type === 'start' ? (todo.start_time || todo.start_at) : (todo.end_time || todo.end_at);
    if (!dateStr) return '미지정';
    const d = new Date(dateStr);
    return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
      {/* 상단 네비게이션 */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 h-16 flex justify-between items-center">
          <span className="font-black text-emerald-600 text-lg tracking-tighter">AI-PLANNER</span>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >로그아웃</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-5 pt-10">
        {/* 대제목 & 소제목 섹션 */}
        <section className="mb-10">
          <p className="text-emerald-600 font-bold text-sm mb-2">반갑습니다, {userEmail}님! 👋</p>
          <h1 className="text-3xl md:text-4xl font-[900] text-gray-900 leading-tight tracking-tighter">
            AI로 계획을 <br className="md:hidden" />다시 그려보세요
          </h1>
          <p className="text-gray-400 text-sm mt-3 font-medium">효율적인 일정 관리를 위한 당신의 AI 비서</p>
        </section>

        {/* 입력 카드 섹션 (PC에서는 더 넓게 보임) */}
        <section className="bg-white p-6 md:p-8 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-gray-50 mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
            <h2 className="text-lg font-black text-gray-800">새로운 계획 추가</h2>
          </div>
          
          <textarea 
            placeholder="어떤 일을 계획하고 계신가요? 내용을 입력해 주세요."
            className="w-full p-5 bg-gray-50 rounded-2xl border-none text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none mb-5 min-h-[120px] transition-all"
          />
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="group flex flex-col items-center justify-center gap-2 bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-emerald-100 transition-all cursor-pointer">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Start</span>
              <span className="text-xs font-bold text-gray-400 group-hover:text-emerald-700 transition-colors">시작 일시 선택</span>
            </div>
            <div className="group flex flex-col items-center justify-center gap-2 bg-gray-50 p-4 rounded-2xl border border-transparent hover:border-rose-100 transition-all cursor-pointer">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">End</span>
              <span className="text-xs font-bold text-gray-400 group-hover:text-rose-700 transition-colors">마감 일시 선택</span>
            </div>
          </div>

          <button className="w-full py-5 bg-gray-900 hover:bg-emerald-600 text-white rounded-2xl font-black text-base shadow-xl shadow-gray-200 transition-all active:scale-[0.98]">
            AI 일정 스마트 생성
          </button>
        </section>

        {/* 리스트 섹션 */}
        <section>
          <div className="flex justify-between items-center mb-6 px-1">
            <h2 className="text-xl font-[900] text-gray-900 tracking-tight">내 계획 리스트</h2>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400">진행 중 {todos.filter(t => !t.is_completed).length}개</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {todos.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[32px] border border-dashed border-gray-200">
                <p className="text-gray-300 text-sm font-medium">등록된 일정이 아직 없네요!</p>
              </div>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} className={`group bg-white p-5 md:p-6 rounded-[28px] border transition-all ${todo.is_completed ? 'border-gray-50 opacity-60' : 'border-white shadow-sm hover:shadow-md hover:border-emerald-100'}`}>
                  <div className="flex items-start gap-4">
                    {/* ✅ 작동하는 체크박스 */}
                    <button 
                      onClick={() => toggleComplete(todo.id, todo.is_completed)}
                      className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${todo.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-200 bg-white hover:border-emerald-400'}`}
                    >
                      {todo.is_completed && <span className="text-white text-[10px] font-bold">✓</span>}
                    </button>

                    {/* 내용 영역 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-bold text-gray-800 text-lg leading-tight break-all ${todo.is_completed ? 'line-through text-gray-400' : ''}`}>
                          {todo.title}
                        </h3>
                      </div>
                      <p className="text-gray-400 text-xs mb-4 line-clamp-2 leading-relaxed">{todo.content}</p>
                      
                      {/* 시간 정보 레이아웃 */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 py-3 border-t border-gray-50 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-emerald-500">START</span>
                          <span className="text-[11px] font-bold text-gray-500">{formatDate(todo, 'start')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-rose-500">END</span>
                          <span className="text-[11px] font-bold text-gray-500">{formatDate(todo, 'end')}</span>
                        </div>
                      </div>
                    </div>

                    {/* ✏️ 수정 & 🗑️ 삭제 버튼 */}
                    <div className="flex flex-col md:flex-row gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-gray-50 rounded-full transition-colors" title="수정">
                        <span className="text-sm">✏️</span>
                      </button>
                      <button 
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 hover:bg-rose-50 rounded-full transition-colors" 
                        title="삭제"
                      >
                        <span className="text-sm">🗑️</span>
                      </button>
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
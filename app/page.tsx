'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function TodoPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false); // AI 분석 중 로딩 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUserEmail(session.user.email?.split('@')[0] || 'User');
      await fetchTodos();
    };
    init();
  }, [router]);

  // 일정 목록 불러오기 (컬럼 이름 created_date로 수정 완료)
  async function fetchTodos() {
    try {
      const { data, error } = await supabase.from('todos').select('*').order('created_date', { ascending: false });
      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) {
      console.error('불러오기 실패:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // --- 어제 구현했던 AI 분석 기능 복구 (올바른 API 경로 적용) ---
  // --- AI 분석 로직 (수정 버전) ---
  const handleAIGenerate = async () => {
    const promptText = title || content;

    if (!promptText) {
      return alert('제목이나 상세내용 칸에 내용을 적고 눌러주세요!');
    }
    
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai-parse-todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // promptText(변수 이름)를 text(서버가 기다리는 이름)라는 키로 보냅니다.
        body: JSON.stringify({ text: promptText }), 
      });
      
      const result = await response.json();
      
      if (response.ok && result) {
        // AI가 분석한 결과를 화면에 적용
        setTitle(result.title || title);
        
        // 카테고리가 있다면 상세내용에 붙여주기 (선택사항)
        const categoryTag = result.category && result.category.length > 0 
          ? `[${result.category.join(', ')}] ` 
          : '';
        setContent(categoryTag + (result.content || content));

        // ✅ 날짜와 시간을 합쳐서 datetime-local 형식(YYYY-MM-DDTHH:MM)으로 변환
        if (result.due_date) {
          const formattedDateTime = `${result.due_date}T${result.due_time || '09:00'}`;
          setStartTime(formattedDateTime);
        }
        
        alert('✨ AI가 일정을 완벽하게 분석했습니다!');
      } else {
        // API에서 보낸 에러 메시지가 있다면 표시
        alert(result.error || '분석 실패');
      }
    } catch (error) {
      console.error('AI 분석 실패:', error);
      alert('AI 서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsAiLoading(false);
    }
  };
  // ------------------------------------------------------------

  // 새로운 일정 추가
  const addTodo = async () => {
    if (!title) return alert('제목을 입력해주세요!');
    
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('todos').insert([{
      title, content, start_time: startTime || null, end_time: endTime || null,
      user_id: session?.user.id, is_completed: false
    }]);

    if (error) {
      alert(`저장 실패: ${error.message}`);
    } else {
      setTitle(''); setContent(''); setStartTime(''); setEndTime('');
      await fetchTodos();
    }
  };

  // 일정 삭제 기능 추가
  const deleteTodo = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) alert('삭제 실패');
    else fetchTodos();
  };

  // 완료 상태 토글 (폭죽 효과 포함)
  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id);
    if (!error) {
      try {
        const confetti = (await import('canvas-confetti')).default;
        if (!currentStatus) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      } catch (e) { console.log("폭죽 미설치"); }
      fetchTodos();
    }
  };

  // 로딩 화면
  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 font-sans text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex justify-between items-center px-6">
        <span className="text-xl font-black italic text-emerald-600">AI PLANNER</span>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="text-xs font-bold text-slate-400">로그아웃</button>
      </nav>
      
      {/* 🛠️ max-w-xl로 너비 적절히 조정 */}
      <main className="mx-auto max-w-xl px-6 pt-10">
        <header className="mb-8 text-center">
          {/* ✅ 제목 변경 */}
          <h1 className="text-3xl font-[950] mb-5 tracking-tighter">AI로 만드는 내 일정 서비스</h1>
          <div className="inline-block bg-white px-5 py-2 rounded-full shadow-sm border border-slate-100 font-bold text-sm text-slate-600">반갑습니다, {userEmail}님! 👋</div>
        </header>

        <section className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-50 mb-12 relative overflow-hidden">
          {/* AI 분석 중일 때 오버레이 */}
          {isAiLoading && (
            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-2"></div>
              <p className="text-xs font-bold text-emerald-600">AI가 일정을 짜고 있어요...</p>
            </div>
          )}

          <div className="space-y-5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-400 ml-2 uppercase tracking-wider">Plan Details</label>
              {/* ✅ 어제 있던 AI 버튼 복구 */}
              <button 
                onClick={handleAIGenerate}
                className="text-[11px] font-black bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                ✨ AI 일정 자동완성
              </button>
            </div>
            
            <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="대제목: 해치울 일" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="상세플랜을 적고 'AI 자동완성'을 눌러보세요 (예: 내일 오후 강남역 미팅 일정 짜줘)" className="w-full p-4 bg-slate-50 rounded-2xl border-none min-h-[100px] outline-none" />
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 ml-2">시작일시</span>
                <input type="datetime-local" value={startTime} onChange={(e)=>setStartTime(e.target.value)} className="p-3 bg-slate-50 rounded-xl text-[11px] font-bold" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-rose-400 ml-2">마감일시</span>
                <input type="datetime-local" value={endTime} onChange={(e)=>setEndTime(e.target.value)} className="p-3 bg-slate-50 rounded-xl text-[11px] font-bold text-rose-500" />
              </div>
            </div>
            <button onClick={addTodo} className="w-full py-5 bg-slate-900 text-white rounded-[22px] font-black text-lg active:scale-95 transition-all hover:bg-emerald-600 shadow-xl">일정 추가하기</button>
          </div>
        </section>

        {/* 하단 리스트 영역 */}
        <div className="space-y-6">
          {todos.map((todo) => (
            <div key={todo.id} className={`group bg-white p-7 rounded-[38px] border transition-all ${todo.is_completed ? 'opacity-60 border-transparent bg-slate-50' : 'shadow-md hover:border-emerald-200'}`}>
              <div className="flex items-start gap-4">
                <button onClick={() => toggleComplete(todo.id, todo.is_completed)} className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${todo.is_completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white'}`}>
                  {todo.is_completed && <span className="font-bold">✓</span>}
                </button>
                <div className="flex-1">
                  <h4 className={`text-xl font-black ${todo.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{todo.title}</h4>
                  <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">{todo.content}</p>
                  
                  {/* 🛠️ 날짜 표시 영역 추가 완료 */}
                  {(todo.start_time || todo.end_time) && (
                    <div className="flex gap-2 mt-3 text-[10px] font-bold">
                      {todo.start_time && <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">시작: {new Date(todo.start_time).toLocaleString()}</span>}
                      {todo.end_time && <span className="text-rose-500 bg-rose-50 px-2 py-1 rounded-md">마감: {new Date(todo.end_time).toLocaleString()}</span>}
                    </div>
                  )}
                </div>
                
                {/* 🛠️ 삭제 버튼 추가 완료 (아이콘 디자인 적용) */}
                <button onClick={() => deleteTodo(todo.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))}
          {todos.length === 0 && <div className="text-center py-20 text-slate-300 font-bold">아직 등록된 일정이 없습니다.</div>}
        </div>
      </main>
    </div>
  );
}
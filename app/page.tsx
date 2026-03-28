'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>;
const CancelIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;

export default function TodoPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');

  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        window.location.href = '/login';
        return;
      }
      setUserEmail(session.user.email?.split('@')[0] || 'User');
      await fetchTodos();
    };
    init();
  }, []);

  async function fetchTodos() {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_date', { ascending: false });

      if (error) return console.error('데이터 로드 실패:', error.message);
      setTodos(data || []);
    } catch (error: any) {
      console.error('네트워크 에러:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ AI 기능 업그레이드: 분석 후 바로 리스트에 추가합니다!
  const handleAIGenerate = async () => {
    const promptText = title || content;
    if (!promptText) return alert('제목이나 내용 칸에 일정을 적어주세요!');

    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai-parse-todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: promptText }),
      });
      const result = await response.json();

      if (response.ok && result) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // AI가 준 날짜 데이터 조립
        let finalStartTime = null;
        if (result.due_date && result.due_date !== '미정') {
          finalStartTime = `${result.due_date}T${result.due_time && result.due_time !== '미정' ? result.due_time : '09:00'}`;
        }

        // 🚀 알아서 DB에 바로 저장!
        const { error } = await supabase.from('todos').insert([{
          title: result.title || title,
          content: result.content || '',
          start_time: finalStartTime,
          user_id: session.user.id,
          is_completed: false
        }]);

        if (!error) {
          setTitle(''); setContent(''); setStartTime(''); setEndTime('');
          await fetchTodos(); // 목록 새로고침
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.8 } }); // 폭죽 팡!
        }
      }
    } catch (error) {
      alert('AI 서버 연결 실패');
    } finally {
      setIsAiLoading(false);
    }
  };

  const addTodo = async () => {
    if (!title) return alert('제목을 입력해주세요!');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return alert('로그인이 필요합니다.');

    const { error } = await supabase.from('todos').insert([{
      title, content, start_time: startTime || null, end_time: endTime || null,
      user_id: session.user.id, is_completed: false
    }]);

    if (!error) {
      setTitle(''); setContent(''); setStartTime(''); setEndTime('');
      await fetchTodos();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id);
    if (!error) {
      if (!currentStatus) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      fetchTodos();
    }
  };

  const deleteTodo = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (!error) fetchTodos();
  };

  const startEditing = (todo: any) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditContent(todo.content || '');
    setEditStartTime(todo.start_time ? todo.start_time.slice(0, 16) : '');
    setEditEndTime(todo.end_time ? todo.end_time.slice(0, 16) : '');
  };

  const cancelEditing = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    if (!editTitle) return alert('제목은 필수입니다.');
    const { error } = await supabase.from('todos').update({
        title: editTitle, content: editContent,
        start_time: editStartTime || null, end_time: editEndTime || null,
      }).eq('id', id);

    if (!error) {
      setEditingId(null);
      await fetchTodos();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace('/login');
  };

  if (loading) return <div className="p-20 text-center font-bold text-emerald-600">데이터 로딩 중...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 px-6 text-slate-900 font-sans">
      <main className="mx-auto max-w-xl pt-10">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI PLANNER</h1>
            <p className="text-sm font-medium text-emerald-600">반갑습니다, {userEmail}님! 👋</p>
          </div>
          <button onClick={handleLogout} className="text-xs bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-300">로그아웃</button>
        </header>

        <section className="bg-white p-7 rounded-[35px] shadow-2xl mb-10 relative">
          {isAiLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-20 rounded-[35px]">
              <p className="font-bold text-emerald-600 animate-pulse">AI가 일정을 정리하고 등록 중입니다... ✨</p>
            </div>
          )}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Plan Details</span>
              <button onClick={handleAIGenerate} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-all">✨ AI 자동완성</button>
            </div>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="예: 내일 오후 2시 강남 미팅" className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-lg" />
            <textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="직접 적거나 AI에게 맡겨보세요" className="w-full p-4 bg-slate-50 rounded-2xl min-h-[100px] outline-none text-sm whitespace-pre-wrap" />
            <div className="grid grid-cols-2 gap-2">
              <input type="datetime-local" value={startTime} onChange={(e)=>setStartTime(e.target.value)} className="p-3 bg-slate-50 rounded-xl text-xs outline-none text-slate-600" />
              <input type="datetime-local" value={endTime} onChange={(e)=>setEndTime(e.target.value)} className="p-3 bg-slate-50 rounded-xl text-xs outline-none text-slate-600" />
            </div>
            <button onClick={addTodo} className="w-full py-5 bg-slate-900 text-white rounded-[25px] font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg text-lg">일정 추가하기</button>
          </div>
        </section>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-widest mb-4">My Plan List ({todos.length})</h3>
          
          {todos.map((todo) => {
            const isEditing = editingId === todo.id;
            return (
              <div key={todo.id} className={`bg-white p-6 rounded-[35px] shadow-sm flex items-start gap-4 hover:shadow-md transition-all group ${todo.is_completed ? 'bg-slate-50' : ''}`}>
                {!isEditing && (
                  <button onClick={() => toggleComplete(todo.id, todo.is_completed)} className={`mt-1.5 h-6 w-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${todo.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 hover:border-emerald-300'}`}>
                    {todo.is_completed && <span className="text-white text-xs">✓</span>}
                  </button>
                )}

                {isEditing ? (
                  <div className="flex-1 space-y-3 p-1">
                    <input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} className="w-full p-3 bg-slate-100 rounded-xl outline-none font-bold text-base" />
                    <textarea value={editContent} onChange={(e)=>setEditContent(e.target.value)} className="w-full p-3 bg-slate-100 rounded-xl outline-none text-sm min-h-[80px] whitespace-pre-wrap" />
                    <div className="grid grid-cols-2 gap-2">
                      <input type="datetime-local" value={editStartTime} onChange={(e)=>setEditStartTime(e.target.value)} className="p-2 bg-slate-100 rounded-lg text-xs" />
                      <input type="datetime-local" value={editEndTime} onChange={(e)=>setEditEndTime(e.target.value)} className="p-2 bg-slate-100 rounded-lg text-xs" />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-lg font-bold truncate ${todo.is_completed ? 'line-through text-slate-300' : 'text-slate-800'}`}>{todo.title}</h4>
                    {todo.content && <p className={`text-sm mt-2 leading-relaxed whitespace-pre-wrap ${todo.is_completed ? 'text-slate-300' : 'text-slate-500'}`}>{todo.content}</p>}
                    {(todo.start_time || todo.end_time) && (
                      <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-bold">
                        {todo.start_time && <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md">시작: {new Date(todo.start_time).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                        {todo.end_time && <span className="bg-rose-50 text-rose-500 px-2 py-1 rounded-md">마감: {new Date(todo.end_time).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-shrink-0 flex items-center gap-1 mt-1">
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(todo.id)} className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50"><SaveIcon /></button>
                      <button onClick={cancelEditing} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"><CancelIcon /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditing(todo)} className="p-2 rounded-lg text-slate-300 hover:text-emerald-500 hover:bg-emerald-50"><EditIcon /></button>
                      <button onClick={() => deleteTodo(todo.id)} className="p-2 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50"><TrashIcon /></button>
                    </>
                  )}
                </div>
              </div>
            ); 
          })}
        </div>
      </main>
    </div>
  );
}
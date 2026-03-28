"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

interface Todo {
  id: number;
  content: string;
  description?: string;
  start_time: string;
  end_time: string;
  is_completed: boolean;
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchTodos(user.id);
      }
    };
    checkUser();
  }, []);

  const fetchTodos = async (userId: string) => {
    const { data } = await supabase.from("todos").select("*").eq("user_id", userId).order("id", { ascending: false });
    if (data) setTodos(data);
  };

  // ✨ AI 자동완성 (제목 칸에 쓴 내용을 분석해서 채움)
  const handleAIAutoFill = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        prompt: `텍스트: "${title}" 에서 정보를 추출해 JSON으로 줘. 형식: { "title": "제목", "desc": "상세내용", "start": "YYYY-MM-DDTHH:mm", "end": "YYYY-MM-DDTHH:mm" }. 현재시간: ${new Date().toISOString()}`,
      });
      const res = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);
      setTitle(res.title || title);
      setDescription(res.desc || "");
      setStartTime(res.start?.slice(0, 16) || "");
      setEndTime(res.end?.slice(0, 16) || "");
    } catch (e) {
      alert("AI 분석 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async () => {
    if (!title) return;
    const { error } = await supabase.from("todos").insert([{
      content: title,
      description: description,
      start_time: startTime || new Date().toISOString(),
      end_time: endTime || new Date().toISOString(),
      user_id: user.id,
    }]);
    if (!error) {
      setTitle(""); setDescription(""); setStartTime(""); setEndTime("");
      fetchTodos(user.id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-slate-50/50 p-6 pb-20 font-sans">
      <header className="py-12 text-center">
        <h1 className="text-3xl font-bold text-slate-800">AI로 만드는 내 일정 서비스</h1>
      </header>

      {/* ⚪ 메인 입력 카드 */}
      <div className="bg-white rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] mb-12 relative">
        <button 
          onClick={handleAIAutoFill}
          className="absolute top-8 right-10 text-[11px] font-bold bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100 flex items-center gap-1 hover:bg-green-100 transition-all"
        >
          ✨ {loading ? "분석중..." : "AI 자동완성"}
        </button>

        <div className="space-y-4">
          <input 
            className="w-full p-4 bg-slate-50 rounded-2xl text-base outline-none border-none placeholder:text-slate-400"
            placeholder="내일 강남에서 오후 2시에 미팅있어"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea 
            className="w-full p-4 bg-slate-50 rounded-2xl text-base outline-none border-none placeholder:text-slate-400 resize-none"
            placeholder="내용"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-4">
            <input type="datetime-local" className="flex-1 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border-none outline-none" value={startTime} onChange={e => setStartTime(e.target.value)} />
            <input type="datetime-local" className="flex-1 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 border-none outline-none" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
          <button 
            onClick={handleAddTodo}
            className="w-full bg-[#0f172a] text-white py-4 rounded-2xl font-bold text-base mt-2 active:scale-[0.98] transition-all shadow-lg shadow-slate-200"
          >
            일정 추가
          </button>
        </div>
      </div>

      {/* ⚪ 리스트 목록 */}
      <div className="max-w-xl mx-auto space-y-3">
        {todos.map(todo => (
          <div key={todo.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-50 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${todo.is_completed ? 'bg-green-500 border-green-500' : 'border-slate-200'}`}
                onClick={async () => {
                  await supabase.from("todos").update({ is_completed: !todo.is_completed }).eq("id", todo.id);
                  fetchTodos(user.id);
                }}
              >
                {todo.is_completed && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div>
                <h3 className={`font-bold text-slate-700 ${todo.is_completed ? 'line-through text-slate-300 font-normal' : ''}`}>{todo.content}</h3>
                {todo.description && <p className="text-xs text-slate-400 mt-0.5">{todo.description}</p>}
              </div>
            </div>
            <button 
              onClick={async () => { await supabase.from("todos").delete().eq("id", todo.id); fetchTodos(user.id); }}
              className="text-xs text-slate-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-400"
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
"use client";

/**
 * AI PLANNER 메인 페이지
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import confetti from "canvas-confetti";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_completed: boolean;
}

interface EditData {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

const TodoPage = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [rawInput, setRawInput] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditData>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({ id: u.id, email: u.email });
        void fetchTodos(u.id);
      }
    });
  }, []);

  const fetchTodos = async (userId: string) => {
    const { data } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", userId)
      .order("start_time", { ascending: true });
    if (data) setTodos(data as Todo[]);
  };

  const formatForInput = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const normalized = dateStr.trim().replace(" ", "T");
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) return normalized.slice(0, 16);
      return "";
    } catch {
      return "";
    }
  };

  const formatDisplay = (isoStr: string) =>
    new Date(isoStr).toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleAIAutoFill = async () => {
    if (!rawInput.trim()) {
      alert("먼저 일정 내용을 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai-parse-todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawInput.trim() }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "AI 분석에 실패했습니다.");
      }
      if (result.title) setRawInput(result.title);
      if (result.desc) setDescription(result.desc);
      const start = formatForInput(result.start);
      const end = formatForInput(result.end);
      if (start) setStartTime(start);
      if (end) setEndTime(end);
    } catch (e) {
      console.error("AI 자동완성 실패:", e);
      alert(`AI 분석 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async () => {
    if (!rawInput.trim()) return alert("제목을 입력하세요.");
    if (!user?.id) return alert("로그인이 필요합니다.");
    const { error } = await supabase.from("todos").insert([
      {
        title: rawInput.trim(),
        description: description.trim(),
        start_time: startTime || new Date().toISOString(),
        end_time: endTime || new Date().toISOString(),
        user_id: user.id,
        is_completed: false,
      },
    ]);
    if (error) {
      alert(`저장 실패: ${error.message}`);
      return;
    }
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    setRawInput("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    await fetchTodos(user.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (!error && user?.id) await fetchTodos(user.id);
  };

  const handleEditStart = (todo: Todo) => {
    setEditingId(todo.id);
    setEditData({
      title: todo.title,
      description: todo.description || "",
      start_time: formatForInput(todo.start_time),
      end_time: formatForInput(todo.end_time),
    });
  };

  const handleEditSave = async () => {
    if (!editData.title.trim()) return alert("제목을 입력하세요.");
    if (!editingId || !user?.id) return;
    const { error } = await supabase
      .from("todos")
      .update({
        title: editData.title.trim(),
        description: editData.description.trim(),
        start_time: editData.start_time || new Date().toISOString(),
        end_time: editData.end_time || new Date().toISOString(),
      })
      .eq("id", editingId);
    if (!error) {
      setEditingId(null);
      await fetchTodos(user.id);
    }
  };

  const handleToggle = async (todo: Todo) => {
    const completing = !todo.is_completed;
    await supabase.from("todos").update({ is_completed: completing }).eq("id", todo.id);
    if (completing) {
      confetti({
        particleCount: 200,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#22C55E", "#86EFAC", "#BBF7D0", "#FDE68A", "#FCA5A5"],
      });
    }
    if (user?.id) await fetchTodos(user.id);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8F9FD] p-6 pb-20 font-sans text-slate-900">
      <header className="flex justify-between items-center py-6">
        <div>
          <h1 className="text-[30px] font-black text-[#1A202C] tracking-tighter italic uppercase">
            AI Planner
          </h1>
          {user && (
            <p className="text-[12px] font-bold text-[#22C55E]">
              반갑습니다, {user.email?.split("@")[0]}님!
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() =>
            supabase.auth.signOut().then(() => {
              window.location.href = "/login";
            })
          }
          className="text-[11px] font-bold text-slate-400"
        >
          로그아웃
        </button>
      </header>

      <div className="bg-white rounded-[32px] p-7 shadow-2xl mb-8 border border-white">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            Plan Details
          </span>
          <button
            type="button"
            onClick={() => void handleAIAutoFill()}
            disabled={loading}
            className="text-[12px] font-bold bg-[#F0FDF4] text-[#22C55E] px-5 py-2.5 rounded-full active:scale-95 transition-all disabled:opacity-50"
          >
            ✨ {loading ? "분석 중..." : "AI 자동완성"}
          </button>
        </div>
        <div className="space-y-5">
          <input
            className="w-full p-4 bg-[#F8F9FD] rounded-2xl text-[19px] font-black outline-none border-none"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="일정 제목 또는 자연어 입력"
          />
          <textarea
            className="w-full p-4 bg-[#F8F9FD] rounded-2xl text-[14px] text-slate-500 font-medium outline-none border-none resize-none whitespace-pre-line"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="상세 내용 (AI 자동완성 시 자동 입력)"
          />
          <div className="flex gap-3">
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-black text-slate-400 block mb-1">시작</label>
              <input
                type="datetime-local"
                className="w-full p-3 bg-[#F8F9FD] rounded-xl text-[12px] font-bold outline-none border-none"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[11px] font-black text-rose-400 block mb-1">마감</label>
              <input
                type="datetime-local"
                className="w-full p-3 bg-[#F8F9FD] rounded-xl text-[12px] font-bold outline-none border-none text-rose-500"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleAddTodo()}
            className="w-full bg-[#1A202C] text-white py-5 rounded-3xl font-bold text-[18px] shadow-xl active:scale-95 transition-all mt-4"
          >
            일정 저장하기 🎊
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-1">
          My Plan List ({todos.length})
        </p>

        {todos.length === 0 && (
          <p className="text-center text-slate-300 font-bold text-sm py-10">등록된 일정이 없습니다.</p>
        )}

        {todos.map((todo) => (
          <div key={todo.id} className="bg-white rounded-[28px] shadow-sm border border-white overflow-hidden">
            {editingId === todo.id ? (
              <div className="p-6 space-y-3">
                <input
                  className="w-full p-3 bg-[#F8F9FD] rounded-xl text-[16px] font-black outline-none"
                  value={editData.title}
                  onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
                  placeholder="제목"
                />
                <textarea
                  className="w-full p-3 bg-[#F8F9FD] rounded-xl text-[13px] text-slate-500 outline-none resize-none"
                  rows={3}
                  value={editData.description}
                  onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="상세 내용"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-slate-400 block mb-1">시작</label>
                    <input
                      type="datetime-local"
                      className="w-full p-2 bg-[#F8F9FD] rounded-lg text-[11px] font-bold outline-none"
                      value={editData.start_time}
                      onChange={(e) => setEditData((p) => ({ ...p, start_time: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black text-rose-400 block mb-1">마감</label>
                    <input
                      type="datetime-local"
                      className="w-full p-2 bg-[#F8F9FD] rounded-lg text-[11px] font-bold outline-none text-rose-500"
                      value={editData.end_time}
                      onChange={(e) => setEditData((p) => ({ ...p, end_time: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handleEditSave()}
                    className="flex-1 bg-[#1A202C] text-white py-3 rounded-2xl font-bold text-[14px] active:scale-95 transition-all"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-[#F8F9FD] text-slate-400 py-3 rounded-2xl font-bold text-[14px] active:scale-95 transition-all"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => void handleToggle(todo)}
                      className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-all active:scale-90 ${todo.is_completed ? "bg-[#22C55E] border-[#22C55E] shadow-md shadow-green-200" : "border-slate-200 hover:border-green-300"}`}
                    >
                      {todo.is_completed && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <h3
                      className={`text-[17px] font-black tracking-tight leading-tight truncate transition-all ${todo.is_completed ? "line-through text-slate-300" : "text-slate-800"}`}
                    >
                      {todo.title}
                    </h3>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditStart(todo)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-all active:scale-90"
                      title="수정"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(todo.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {todo.description && (
                  <p className="text-[13px] text-slate-400 font-medium mt-3 whitespace-pre-line leading-relaxed">
                    {todo.description}
                  </p>
                )}

                <div className="flex gap-4 mt-4 pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-500 uppercase">START</span>
                    <span className="text-[14px] font-black text-slate-700">
                      {formatDisplay(todo.start_time)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-rose-400 uppercase">END</span>
                    <span className="text-[14px] font-black text-slate-700">
                      {formatDisplay(todo.end_time)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodoPage;

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Todo = {
  id: string;
  title: string;
  completed: boolean;
  description?: string | null;  // 👈 | null 추가!
  due_date?: string | null;     // 👈 | null 추가!
  created_date?: string | null; // 👈 | null 추가!
};

// 🌟 마법 1: 화면에 '오전/오후 00시 00분'으로 예쁘게 보여주는 번역기
const formatDisplayDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', { 
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: 'numeric', 
    hour12: true // 👈 이게 바로 오전/오후를 표시해주는 마법의 스위치입니다!
  });
};

// 🌟 마법 2: DB의 시간을 입력창(시계)에 맞게 변환해 주는 번역기
const formatForInput = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [dueDateValue, setDueDateValue] = useState("");
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [user, setUser] = useState<any>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editCreatedDate, setEditCreatedDate] = useState(""); 

  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndTodos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('todos')
          .select('id, title, completed, description, due_date, created_date')
          .eq('user_id', user.id)
          .order('created_date', { ascending: true });

        if (!error && data) setTodos(data);
      }
    };
    fetchUserAndTodos();
  }, []);

  const handleAddTodo = async () => {
    if (inputValue.trim() === "" || !user) return;

    const newTodo = {
      user_id: user.id,
      title: inputValue,
      description: descriptionValue || null,
      due_date: dueDateValue ? new Date(dueDateValue).toISOString() : null,
      completed: false
    };

    const { data, error } = await supabase
      .from('todos').insert([newTodo]).select().single();

    if (!error && data) {
      setTodos([...todos, data]);
      setInputValue("");
      setDescriptionValue("");
      setDueDateValue("");
    }
  };

  const handleDeleteTodo = async (idToRemove: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', idToRemove);
    if (!error) setTodos(todos.filter((todo) => todo.id !== idToRemove));
  };

  const handleToggleComplete = async (idToToggle: string, currentStatus: boolean) => {
    setTodos(todos.map(todo => todo.id === idToToggle ? { ...todo, completed: !currentStatus } : todo));
    await supabase.from('todos').update({ completed: !currentStatus }).eq('id', idToToggle);
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
    // ⏰ 수정할 때 날짜뿐만 아니라 '시간'도 그대로 가져오게 바꿨습니다!
    setEditDueDate(formatForInput(todo.due_date)); 
    setEditCreatedDate(formatForInput(todo.created_date)); 
  };

  const saveEdit = async (id: string) => {
    if (editTitle.trim() === "") return alert("제목은 비워둘 수 없어요!");

    const updatedData = {
      title: editTitle,
      description: editDescription || null,
      due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
      created_date: editCreatedDate ? new Date(editCreatedDate).toISOString() : undefined 
    };

    const { error } = await supabase.from('todos').update(updatedData).eq('id', id);

    if (!error) {
      setTodos(todos.map(todo => todo.id === id ? { ...todo, ...updatedData } : todo));
      setEditingId(null); 
    } else {
      alert("수정 실패: " + error.message);
    }
  };

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-50 text-gray-900">
      <h1 className="text-4xl font-bold mb-6">✨ 우당탕탕 AI 투두 매니저</h1>

      {!user ? (
         <div className="flex gap-4 mb-8">
            <Link href="/login" className="px-5 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition-colors shadow-sm">로그인하러 가기</Link>
         </div>
      ) : (
        <p className="mb-8 text-lg font-semibold text-blue-600">환영합니다, VIP {user.email} 님! 👋</p>
      )}

      <div className="w-full max-w-md bg-white p-5 rounded-xl shadow-md border border-gray-200 flex flex-col gap-3">
        <input
          type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
          placeholder={user ? "오늘 해치울 일은 무엇인가요? (필수)" : "로그인해야 입력할 수 있어요 🔒"}
          disabled={!user}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 font-bold"
        />
        <textarea
          value={descriptionValue} onChange={(e) => setDescriptionValue(e.target.value)}
          placeholder="어떻게 실행할지 상세 플랜을 적어보세요 (선택)" disabled={!user}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm h-24 resize-none"
        />
        <div className="flex gap-2 items-center">
          <span className="text-sm font-bold text-gray-500 whitespace-nowrap">마감 시간:</span>
          {/* ⏰ 타입을 date에서 'datetime-local'로 바꿨습니다! */}
          <input 
            type="datetime-local" value={dueDateValue} onChange={(e) => setDueDateValue(e.target.value)} disabled={!user}
            className="flex-1 p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-600 disabled:bg-gray-100"
          />
          <button 
            onClick={handleAddTodo} disabled={!user || inputValue.trim() === ""}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-sm transition-colors disabled:bg-gray-400 whitespace-nowrap"
          >
            추가
          </button>
        </div>
      </div>

      <div className="w-full max-w-md mt-8">
        {todos.length > 0 && (
          <div className="mb-4 flex justify-between items-center text-sm font-bold text-gray-600 bg-gray-100 p-3 rounded-lg">
            <span>오늘의 달성률 🚀</span>
            <span className="text-blue-600">{completedCount} / {todos.length} 완료</span>
          </div>
        )}

        {todos.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">아직 등록된 할 일이 없네요. 뒹굴거려도 좋습니다! 🛌</p>
        ) : (
          <ul className="space-y-4">
            {todos.map((todo) => (
              <li key={todo.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col transition-all">
                
                {editingId === todo.id ? (
                  <div className="flex flex-col gap-2">
                    <input 
                      type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full p-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                    <textarea 
                      value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full p-2 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none h-20"
                    />
                    
                    <div className="flex flex-col gap-2 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-green-600 whitespace-nowrap w-16">🟢 시작:</span>
                        {/* ⏰ 시계 모양 입력창으로 업그레이드! */}
                        <input 
                          type="datetime-local" value={editCreatedDate} onChange={(e) => setEditCreatedDate(e.target.value)}
                          className="flex-1 p-1.5 border border-green-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm font-bold text-red-500 whitespace-nowrap w-16">🔴 마감:</span>
                          <input 
                            type="datetime-local" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)}
                            className="flex-1 p-1.5 border border-red-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-bold hover:bg-gray-300">취소</button>
                          <button onClick={() => saveEdit(todo.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700">저장</button>
                        </div>
                      </div>

                    </div>
                  </div>

                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-start gap-3 mt-1 w-full">
                        <input 
                          type="checkbox" checked={todo.completed} onChange={() => handleToggleComplete(todo.id, todo.completed)}
                          className="w-5 h-5 mt-0.5 cursor-pointer accent-blue-600 flex-shrink-0"
                        />
                        <div className="flex flex-col w-full">
                          <span className={`font-bold text-lg ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {todo.title}
                          </span>
                          
                          <div className="flex flex-col gap-1 mt-2">
                            {todo.created_date && (
                              <span className="text-xs font-semibold text-gray-600 bg-green-50 px-2 py-1 rounded w-fit">
                                {/* ⏰ 오전/오후 번역기를 거쳐서 화면에 짠! */}
                                🟢 시작: {formatDisplayDate(todo.created_date)}
                              </span>
                            )}
                            {todo.due_date && (
                              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded w-fit">
                                🔴 마감: {formatDisplayDate(todo.due_date)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 ml-4 flex-shrink-0">
                        <button onClick={() => startEditing(todo)} className="text-blue-500 hover:text-blue-700 text-sm font-bold whitespace-nowrap">수정</button>
                        <button onClick={() => handleDeleteTodo(todo.id)} className="text-red-400 hover:text-red-600 text-sm font-bold whitespace-nowrap">삭제</button>
                      </div>
                    </div>

                    {todo.description && (
                      <div className={`mt-3 ml-8 p-3 rounded-md text-sm ${todo.completed ? 'bg-gray-50 text-gray-400' : 'bg-blue-50 text-blue-800'}`}>
                        {todo.description}
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
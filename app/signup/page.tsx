"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// 📦 우리가 다룰 데이터의 모양을 정의합니다.
type Todo = {
  id: string;
  title: string;
};

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [user, setUser] = useState<any>(null); // 로그인한 유저 정보 저장

  const supabase = createClient();

  // 🧠 화면이 처음 켜질 때 딱 한 번 실행되는 기억력 회복 마법
  useEffect(() => {
    const fetchUserAndTodos = async () => {
      // 1. 현재 접속한 사람이 VIP(로그인 유저)인지 확인합니다.
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. VIP가 맞다면, 창고(DB)에서 내 할 일 목록을 싹 가져옵니다.
      if (user) {
        const { data, error } = await supabase
          .from('todos') // 창고 이름
          .select('id, title') // 가져올 물건 이름표
          .eq('user_id', user.id) // 내 물건만!
          .order('created_date', { ascending: true }); // 옛날에 쓴 것부터 순서대로!

        if (!error && data) {
          setTodos(data);
        }
      }
    };

    fetchUserAndTodos();
  }, []);

  // ⚡ 할 일을 추가할 때 실행되는 마법
  const handleAddTodo = async () => {
    if (inputValue.trim() === "" || !user) return; // 빈칸이거나 로그인 안 했으면 튕겨내기!

    // 1. 창고에 넣을 새 박스 포장하기
    const newTodo = {
      user_id: user.id, // 이건 내 거다! 하고 이름표 붙이기
      title: inputValue,
    };

    // 2. 집주인에게 박스 던져주기 (DB 삽입)
    const { data, error } = await supabase
      .from('todos')
      .insert([newTodo])
      .select()
      .single();

    if (error) {
      alert("앗! 저장에 실패했어요: " + error.message);
    } else if (data) {
      // 3. 저장이 성공하면 내 화면 목록에도 띄워주기
      setTodos([...todos, { id: data.id, title: data.title }]);
      setInputValue(""); // 입력창 비우기
    }
  };

  // 🗑️ 할 일을 삭제할 때 실행되는 마법
  const handleDeleteTodo = async (idToRemove: string) => {
    // 1. 창고에서 먼저 태워버리기 (DB 삭제)
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', idToRemove);

    if (!error) {
      // 2. 창고에서 지워졌으면 내 화면에서도 쓱 지우기
      setTodos(todos.filter((todo) => todo.id !== idToRemove));
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24 bg-gray-50 text-gray-900">
      
      <h1 className="text-4xl font-bold mb-6">
        ✨ 우당탕탕 AI 투두 매니저
      </h1>

      {/* 🎭 로그인 상태에 따라 안내 문구가 바뀝니다! */}
      {!user ? (
         <div className="flex gap-4 mb-8">
            <Link href="/login" className="px-5 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200 transition-colors shadow-sm">
              로그인하러 가기
            </Link>
         </div>
      ) : (
        <p className="mb-8 text-lg font-semibold text-blue-600">
          환영합니다, VIP {user.email} 님! 👋
        </p>
      )}

      <div className="w-full max-w-md flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
          placeholder={user ? "오늘 해치울 일은 무엇인가요?" : "로그인해야 입력할 수 있어요 🔒"}
          disabled={!user} // 로그인 안 하면 입력창 잠금!
          className="flex-1 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
        />
        <button 
          onClick={handleAddTodo}
          disabled={!user}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700 shadow-sm transition-colors disabled:bg-gray-400"
        >
          추가
        </button>
      </div>

      <div className="w-full max-w-md mt-8">
        {todos.length === 0 ? (
          <p className="text-center text-gray-500">아직 등록된 할 일이 없네요. 뒹굴거려도 좋습니다! 🛌</p>
        ) : (
          <ul className="space-y-3">
            {todos.map((todo) => (
              <li key={todo.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex justify-between items-center">
                <span className="font-medium">{todo.title}</span>
                <button 
                  onClick={() => handleDeleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-bold"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

    </main>
  );
}
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

interface PlanTemplate {
  id: string;
  title: string;
  description: string;
  category: "면접" | "시험" | "업무 루틴" | "내 템플릿";
  payload: {
    rawInput: string;
    description: string;
    startTime: string;
    endTime: string;
  };
}

const LOCAL_TEMPLATE_KEY = "ai-planner-user-templates-v1";

const BASIC_TEMPLATES: PlanTemplate[] = [
  {
    id: "base-interview",
    title: "면접 준비 1일 루틴",
    description: "회사 조사, 예상 질문, 자기소개 연습 순서로 정리합니다.",
    category: "면접",
    payload: {
      rawInput: "면접 준비 루틴",
      description: "1) 회사/직무 리서치\n2) 예상 질문 10개 답변 작성\n3) 1분 자기소개 리허설",
      startTime: "",
      endTime: "",
    },
  },
  {
    id: "base-exam",
    title: "시험 대비 집중 블록",
    description: "과목별 50분 집중 + 10분 휴식 사이클입니다.",
    category: "시험",
    payload: {
      rawInput: "시험 대비 집중 학습",
      description: "과목 A 50분 - 휴식 10분 - 과목 B 50분 - 오답 정리 30분",
      startTime: "",
      endTime: "",
    },
  },
  {
    id: "base-work",
    title: "업무 시작 루틴",
    description: "우선순위 점검, 메일 확인, 핵심 업무 1개 완료를 목표로 합니다.",
    category: "업무 루틴",
    payload: {
      rawInput: "업무 시작 루틴",
      description: "1) 오늘 우선순위 3개 선정\n2) 메일/메신저 20분 정리\n3) 핵심 업무 90분 딥워크",
      startTime: "",
      endTime: "",
    },
  },
];

const TodoPage = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [rawInput, setRawInput] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<PlanTemplate[]>([]);
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_TEMPLATE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PlanTemplate[];
      if (Array.isArray(parsed)) {
        setUserTemplates(parsed);
      }
    } catch (error) {
      console.error("템플릿 로드 실패:", error);
    }
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

  const applyTemplateToForm = (template: PlanTemplate) => {
    setRawInput(template.payload.rawInput);
    setDescription(template.payload.description);
    setStartTime(template.payload.startTime);
    setEndTime(template.payload.endTime);
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!rawInput.trim()) {
      alert("템플릿으로 저장할 제목을 먼저 입력해 주세요.");
      return;
    }

    const template: PlanTemplate = {
      id: `user-${Date.now()}`,
      title: rawInput.trim(),
      description: description.trim() || "사용자가 저장한 템플릿",
      category: "내 템플릿",
      payload: {
        rawInput: rawInput.trim(),
        description: description.trim(),
        startTime,
        endTime,
      },
    };

    const nextTemplates = [template, ...userTemplates].slice(0, 20);
    setUserTemplates(nextTemplates);
    localStorage.setItem(LOCAL_TEMPLATE_KEY, JSON.stringify(nextTemplates));
    alert("내 템플릿으로 저장했습니다.");
  };

<<<<<<< HEAD
  const handleDeleteUserTemplate = (templateId: string) => {
    const nextTemplates = userTemplates.filter((template) => template.id !== templateId);
    setUserTemplates(nextTemplates);
    localStorage.setItem(LOCAL_TEMPLATE_KEY, JSON.stringify(nextTemplates));
  };
=======
  /**
   * 인증 상태 실시간 감지
   */
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
        return;
      }
      if (event === 'SIGNED_IN' && session) {
        setUserName(session.user.user_metadata?.full_name ?? '');
        setUserEmail(session.user.email ?? '');
        setUserId(session.user.id);
      }
      if (event === 'TOKEN_REFRESHED' && session) {
        setUserEmail(session.user.email ?? '');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  /** 탭 카운트 */
  const tabCounts = useMemo(() => ({
    all: todos.length,
    completed: todos.filter((t) => t.completed).length,
    in_progress: todos.filter((t) => !t.completed).length,
  }), [todos]);

  /**
   * 탭 + 검색 + 필터 + 정렬 적용된 목록
   */
  const filteredTodos = useMemo(() => {
    let result = [...todos];

    // 탭 필터
    if (activeTab === 'completed') result = result.filter((t) => t.completed);
    else if (activeTab === 'in_progress') result = result.filter((t) => !t.completed);

    // 제목 검색
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

    // 상태 필터
    if (statusFilter === 'in_progress') {
      result = result.filter(
        (t) => !t.completed && (!t.due_date || new Date(t.due_date) >= new Date())
      );
    } else if (statusFilter === 'completed') {
      result = result.filter((t) => t.completed);
    } else if (statusFilter === 'overdue') {
      result = result.filter(
        (t) => !t.completed && t.due_date && new Date(t.due_date) < new Date()
      );
    }

    // 우선순위 필터
    if (priorityFilter !== 'all') {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    // 정렬
    const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    result.sort((a, b) => {
      if (sortOption === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (sortOption === 'due_date') {
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
      }
      if (sortOption === 'title') return a.title.localeCompare(b.title, 'ko');
      return new Date(b.created_date).getTime() - new Date(a.created_date).getTime();
    });

    return result;
  }, [todos, activeTab, searchQuery, statusFilter, priorityFilter, sortOption]);

  const openForm = useCallback((todo?: Todo) => {
    setEditingTodo(todo ?? null);
    setIsFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingTodo(null);
  }, []);

  /**
   * 할 일 생성
   */
  const handleAddTodo = useCallback(
    async (data: TodoInsert) => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('인증이 만료되었습니다. 다시 로그인해 주세요.');

        const insertPayload: Record<string, unknown> = {
          user_id: user.id,
          title: data.title,
          description: data.description ?? null,
          due_date: data.due_date ?? null,
          priority: data.priority,
          category: data.category ?? [],
          completed: false,
        };
        // start_date 컬럼이 DB에 없으면 null 전송 시 오류 → 값 있을 때만 포함
        if (data.start_date) insertPayload.start_date = data.start_date;

        const { error } = await supabase.from('todos').insert(insertPayload);

        if (error) throw error;
        await fetchTodos(user.id);
        closeForm();
        showNotification('success', '할 일이 추가되었습니다.');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message
          : (err && typeof err === 'object' && 'message' in err)
            ? String((err as { message: unknown }).message)
            : '할 일을 추가할 수 없습니다.';
        console.error('할 일 추가 실패:', msg, err);
        throw new Error(msg);
      }
    },
    [fetchTodos, closeForm, showNotification]
  );

  /**
   * 할 일 수정
   */
  const handleUpdateTodo = useCallback(
    async (data: TodoInsert) => {
      if (!editingTodo) return;
      try {
        const supabase = createClient();

        // userId 상태 대신 세션에서 직접 가져와 stale 클로저 문제 방지
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('인증이 만료되었습니다. 다시 로그인해 주세요.');

        console.log('[updateTodo] 전달된 due_date:', data.due_date);
        console.log('[updateTodo] todo id:', editingTodo.id);

        const updatePayload: Record<string, unknown> = {
          title: data.title,
          description: data.description ?? null,
          due_date: data.due_date ?? null,
          priority: data.priority,
          category: data.category ?? [],
        };
        if (data.start_date) updatePayload.start_date = data.start_date;

        const { error } = await supabase
          .from('todos')
          .update(updatePayload)
          .eq('id', editingTodo.id)
          .eq('user_id', user.id);

        if (error) throw error;
        await fetchTodos(user.id);
        closeForm();
        showNotification('success', '할 일이 수정되었습니다.');
      } catch (err) {
        console.error('할 일 수정 실패:', err);
        throw new Error(err instanceof Error ? err.message : '할 일을 수정할 수 없습니다. 다시 시도해 주세요.');
      }
    },
    [editingTodo, fetchTodos, closeForm, showNotification]
  );

  const handleFormSubmit = useCallback(
    async (data: TodoInsert) => {
      if (editingTodo) {
        await handleUpdateTodo(data);
      } else {
        await handleAddTodo(data);
      }
    },
    [editingTodo, handleAddTodo, handleUpdateTodo]
  );

  /**
   * 삭제 버튼 클릭 → 확인 다이얼로그 표시
   */
  const handleDeleteClick = useCallback((id: string) => {
    setDeletingTodoId(id);
  }, []);

  /**
   * 삭제 확인 → Supabase 삭제 실행 + 재조회
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingTodoId) return;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증이 만료되었습니다.');

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', deletingTodoId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchTodos(user.id);
      showNotification('success', '할 일이 삭제되었습니다.');
    } catch (err) {
      console.error('할 일 삭제 실패:', err);
      showNotification('error', err instanceof Error ? err.message : '할 일을 삭제할 수 없습니다. 다시 시도해 주세요.');
    } finally {
      setDeletingTodoId(null);
    }
  }, [deletingTodoId, fetchTodos, showNotification]);

  /**
   * 완료 상태 토글
   */
  const handleToggleComplete = useCallback(
    async (id: string, completed: boolean) => {
      // 낙관적 업데이트 (즉각 UI 반영)
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('인증이 만료되었습니다.');

        const { error } = await supabase
          .from('todos')
          .update({ completed })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;

        // DB 업데이트 성공 후 서버 데이터와 재동기화
        await fetchTodos(user.id);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message
          : (err && typeof err === 'object' && 'message' in err)
            ? String((err as { message: unknown }).message)
            : '알 수 없는 오류';
        console.error('완료 상태 변경 실패:', msg, err);
        // 실패 시 낙관적 업데이트 롤백
        setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
        showNotification('error', `상태 변경 실패: ${msg}`);
      }
    },
    [fetchTodos, showNotification]
  );

  /**
   * AI 요약 저장 (Supabase 업데이트 + 로컬 상태 반영)
   */
  const handleAiSummaryUpdate = useCallback(
    async (id: string, summary: string) => {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ai_summary: summary } : t)));
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('todos')
          .update({ ai_summary: summary })
          .eq('id', id)
          .eq('user_id', userId);
        if (error) throw error;
      } catch (err) {
        console.error('AI 요약 저장 실패:', err);
        showNotification('error', 'AI 요약을 저장하지 못했습니다. 다시 시도해 주세요.');
      }
    },
    [userId, showNotification]
  );

  /**
   * 로그아웃
   */
  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error('로그아웃에 실패했습니다.');
    router.push('/login?logout=true');
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          <p className="text-sm">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <p className="text-red-500 font-medium">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-gray-500 underline"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }
>>>>>>> e0c6404a2a0939c533dec3f008e7226dfdbc7b15

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
        {user ? (
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
        ) : (
          <button
            type="button"
            onClick={() => {
              window.location.href = "/login";
            }}
            className="text-[11px] font-bold text-emerald-600"
          >
            로그인
          </button>
        )}
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
          {!user && (
            <p className="text-[12px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              일정 저장은 로그인 후 가능합니다. 먼저 로그인해 주세요.
            </p>
          )}
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
            disabled={!user}
            className="w-full bg-[#1A202C] text-white py-5 rounded-3xl font-bold text-[18px] shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {user ? "일정 저장하기 🎊" : "로그인 후 저장 가능"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[28px] p-5 shadow-sm border border-white mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Template Market</p>
          <button
            type="button"
            onClick={handleSaveCurrentAsTemplate}
            className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            현재 입력 템플릿 저장
          </button>
        </div>

        <div className="space-y-3">
          {[...BASIC_TEMPLATES, ...userTemplates].map((template) => (
            <div key={template.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-black text-slate-800 truncate">{template.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                  <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {template.category}
                  </span>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => applyTemplateToForm(template)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-[#1A202C] text-white"
                  >
                    적용
                  </button>
                  {template.category === "내 템플릿" && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUserTemplate(template.id)}
                      className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-rose-100 text-rose-600"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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

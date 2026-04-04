/**
 * 메인 대시보드 페이지
 * Supabase 완전 연동: CRUD + 검색/필터/정렬 + 삭제확인 + 오류알림 + 변경 후 재조회
 */
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { TodoList } from '@/components/todo/TodoList';
import { TodoForm } from '@/components/todo/TodoForm';
import { Header } from '@/components/dashboard/Header';
import { Toolbar } from '@/components/dashboard/Toolbar';
import type { StatusFilter, SortOption } from '@/components/dashboard/Toolbar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, X, LayoutList, CheckCircle2, Timer } from 'lucide-react';
import type { Todo, TodoInsert, Priority } from '@/types/todo';
import { AiSummarySection } from '@/components/dashboard/AiSummarySection';

const Page = () => {
  const router = useRouter();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** 할일 추가/수정 다이얼로그 */
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  /** 삭제 확인 다이얼로그 */
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);

  /** CRUD 오류/성공 알림 */
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('created_date');
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'in_progress'>('all');

  /**
   * 알림 표시 (3초 후 자동 해제)
   */
  const showNotification = useCallback((type: 'error' | 'success', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  /**
   * 할 일 목록 재조회
   */
  const fetchTodos = useCallback(async (uid: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', uid)
        .order('created_date', { ascending: false });

      if (error) throw error;
      setTodos(data ?? []);
    } catch (err) {
      console.error('할 일 목록 재조회 실패:', err);
      showNotification('error', '목록을 불러올 수 없습니다. 네트워크를 확인해 주세요.');
    }
  }, [showNotification]);

  /**
   * 초기 데이터 로드 (사용자 정보 + 할 일 목록)
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/login');
          return;
        }

        setUserName(user.user_metadata?.full_name ?? '');
        setUserEmail(user.email ?? '');
        setUserId(user.id);
        await fetchTodos(user.id);
      } catch (err) {
        console.error('초기 데이터 로드 실패:', err);
        setLoadError('데이터를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, fetchTodos]);

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
        console.error('완료 상태 변경 실패:', err);
        // 실패 시 낙관적 업데이트 롤백
        setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
        showNotification('error', '상태 변경에 실패했습니다. 다시 시도해 주세요.');
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header userName={userName} userEmail={userEmail} onLogout={handleLogout} />

      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-4">

          {/* 페이지 제목 + 할일 추가 버튼 */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">할 일 목록</h1>
            <Button onClick={() => openForm()} className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              할일 추가
            </Button>
          </div>

          {/* 탭 카운터: 전체 | 완료 | 진행중 */}
          <div className="flex gap-1 border-b">
            {(
              [
                { key: 'all', label: '전체', Icon: LayoutList },
                { key: 'completed', label: '완료', Icon: CheckCircle2 },
                { key: 'in_progress', label: '진행중', Icon: Timer },
              ] as const
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label} {tabCounts[key]}
              </button>
            ))}
          </div>

          {/* 툴바: 검색 + 필터 */}
          <Toolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityFilterChange={setPriorityFilter}
            sortOption={sortOption}
            onSortOptionChange={setSortOption}
          />

          {/* 할 일 목록 */}
          <TodoList
            todos={filteredTodos}
            onToggleComplete={handleToggleComplete}
            onEdit={(todo) => openForm(todo)}
            onDelete={handleDeleteClick}
            onAdd={() => openForm()}
            onAiSummaryUpdate={handleAiSummaryUpdate}
          />

          {/* AI 요약 및 분석 섹션 */}
          <AiSummarySection todos={todos} />
        </div>
      </main>

      {/* 할일 추가/수정 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTodo ? '할 일 수정' : '새 할 일 추가'}</DialogTitle>
          </DialogHeader>
          <TodoForm
            key={editingTodo?.id ?? 'new'}
            todo={editingTodo ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={!!deletingTodoId}
        onOpenChange={(open) => { if (!open) setDeletingTodoId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>할 일을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제한 항목은 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CRUD 오류/성공 알림 토스트 (왼쪽 아래) */}
      {notification && (
        <div
          className={`fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-white text-sm shadow-lg ${
            notification.type === 'error' ? 'bg-red-600' : 'bg-gray-900'
          }`}
        >
          <span>{notification.type === 'error' ? '⚠️' : '✅'}</span>
          {notification.message}
          <button onClick={() => setNotification(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Page;

/**
 * 할 일 우선순위 타입
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * 할 일 데이터 타입
 */
export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_date: string;
  due_date: string | null;
  priority: Priority;
  category: string[];
  completed: boolean;
  ai_summary: string | null;
}

/**
 * 할 일 생성 시 필요한 데이터 타입
 */
export type TodoInsert = Omit<Todo, 'id' | 'user_id' | 'created_date' | 'ai_summary'>;

/**
 * 할 일 업데이트 시 필요한 데이터 타입
 */
export type TodoUpdate = Partial<TodoInsert>;

/**
 * AI 할 일 분석 결과 타입
 */
export interface AiAnalysisResult {
  summary: string;
  urgentTasks: string[];
  insights: string[];
  recommendations: string[];
}

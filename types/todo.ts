// 에러를 통과하기 위한 완벽한 맞춤형 타입(설계도) 세트입니다!

export interface AiAnalysisResult {
  [key: string]: any;
}

export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
<<<<<<< HEAD
  priority: Priority; 
  [key: string]: any;
=======
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_date: string;
  start_date: string | null;
  due_date: string | null;
  priority: Priority;
  category: string[];
  completed: boolean;
  ai_summary: string | null;
>>>>>>> e0c6404a2a0939c533dec3f008e7226dfdbc7b15
}

// 선생님이 찾던 TodoInsert 부품을 추가해 줍니다!
export interface TodoInsert {
  [key: string]: any;
}
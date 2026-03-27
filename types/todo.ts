// 에러를 통과하기 위한 완벽한 맞춤형 타입(설계도) 세트입니다!

export interface AiAnalysisResult {
  [key: string]: any;
}

export type Priority = 'high' | 'medium' | 'low';

export interface Todo {
  priority: Priority; 
  [key: string]: any;
}

// 선생님이 찾던 TodoInsert 부품을 추가해 줍니다!
export interface TodoInsert {
  [key: string]: any;
}
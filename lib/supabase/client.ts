import { createBrowserClient } from '@supabase/ssr'

// 하이픈(-)을 모두 제거한 진짜 주소입니다.
const supabaseUrl = 'https://crxeglrtfdgvvlrxddbw.supabase.co'

// 이미지 38번에서 찾으신 eyJ...로 시작하는 긴 키를 여기에 넣으세요!
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyeGVnbHJ0ZmRndnZscnhkZGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MTg0MDUsImV4cCI6MjA4ODA5NDQwNX0.gWMmXgzDgui5KB-Qd05I3b1JqaxmMnrXa6fAr2sW_Fc'

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
export const createClient = () => supabase
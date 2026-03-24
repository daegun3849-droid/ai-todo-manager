import { createBrowserClient } from '@supabase/ssr'

// 하드코딩 대신 환경 변수를 사용하여 보안과 유연성을 높였습니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// 기존에 createClient() 형태로 사용하던 코드들과의 호환성을 유지합니다.
export const createClient = () => supabase
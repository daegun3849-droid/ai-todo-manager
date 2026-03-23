import { createBrowserClient } from '@supabase/ssr'

// 하이픈(-)과 주소를 정확하게 일치시켰습니다.
const supabaseUrl = 'https://crxeglrtfdgvvl-rxd-dbw.supabase.co'
const supabaseAnonKey = 'sb_publishable_sCcqYSbLmzLpVmRubrORew_TGtp7pJd'

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// 기존에 createClient를 찾던 파일들을 위한 호환성 유지
export const createClient = () => supabase
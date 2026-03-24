import { createBrowserClient } from '@supabase/ssr'
const supabaseUrl = 'https://crxeglrtfdgvvl-rxd-dbw.supabase.co'
const supabaseAnonKey = 'sb_publishable_sCcqYSbLmzLpVmRubrORew_TGtp7pJd'
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
export const createClient = () => supabase
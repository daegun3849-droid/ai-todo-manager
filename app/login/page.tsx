/**
 * 로그인 페이지
 * Supabase signInWithPassword 연동, 오류 메시지, 로딩 상태 처리
 * useSearchParams는 Suspense 경계 안에서만 사용 가능 (Next.js 15 요구사항)
 */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';

/**
 * useSearchParams를 사용하는 내부 컴포넌트
 * Suspense 경계 안에서만 렌더링됩니다.
 */
function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('logout') === 'true') {
      setShowLogoutToast(true);
      const timer = setTimeout(() => setShowLogoutToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  /**
   * 로그인 제출 핸들러
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('이메일을 입력해 주세요.');
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }

    try {
      setIsLoading(true);
      // 상단에서 import한 supabase 객체를 직접 사용합니다.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (
          signInError.message.includes('Invalid login credentials') ||
          signInError.message.includes('invalid_credentials')
        ) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error('이메일 인증이 완료되지 않았습니다. 받은 편지함을 확인해 주세요.');
        }
        throw new Error(signInError.message);
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('로그인 실패:', err);
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* 로그아웃 완료 토스트 */}
      {showLogoutToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-900 text-white text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <span>✅</span>
          로그아웃 되었습니다.
        </div>
      )}
      
      <div className="mb-6 text-center">
        <div className="text-5xl mb-2 text-blue-600">✅</div>
        <h1 className="text-2xl font-bold text-slate-800">AI Todo Manager</h1>
        <p className="text-gray-500">AI가 도와주는 스마트한 할 일 관리</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100">
        <h2 className="text-xl font-bold text-center mb-1">로그인</h2>
        <p className="text-center text-gray-400 text-xs mb-8">
          스마트한 할 일 관리 시스템에 오신 것을 환영합니다
        </p>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                disabled={isLoading}
                className="w-full border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                disabled={isLoading}
                className="w-full border-slate-200 rounded-xl pl-11 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 bg-slate-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                로그인 중...
              </>
            ) : (
              '로그인하기 →'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-50">
          <p className="text-center text-sm text-slate-500 mb-4">아직 계정이 없으신가요?</p>
          <Link href="/signup">
            <button className="w-full border-2 border-slate-100 text-slate-700 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
              🌟 10초만에 회원가입하기
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * 최종 내보내기 (Suspense 래퍼)
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 text-sm animate-pulse">페이지를 준비하고 있습니다...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
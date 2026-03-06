/**
 * 로그인 페이지
 * Supabase signInWithPassword 연동, 오류 메시지, 로딩 상태 처리
 * useSearchParams는 Suspense 경계 안에서만 사용 가능 (Next.js 15 요구사항)
 */
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';

/**
 * useSearchParams를 사용하는 내부 컴포넌트
 * Suspense 경계 안에서만 렌더링됩니다.
 */
const LoginContent = () => {
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
      const supabase = createClient();
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      {/* 로그아웃 완료 토스트 (왼쪽 아래) */}
      {showLogoutToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-900 text-white text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <span>✅</span>
          로그아웃 되었습니다.
        </div>
      )}
      <div className="mb-6 text-center">
        <div className="text-5xl mb-2">✅</div>
        <h1 className="text-2xl font-bold">AI Todo Manager</h1>
        <p className="text-gray-500">스마트한 할 일 관리</p>
      </div>

      <div className="bg-white rounded-xl shadow p-8 w-full max-w-md">
        <h2 className="text-xl font-bold text-center mb-1">로그인</h2>
        <p className="text-center text-gray-500 text-xs mb-6 whitespace-nowrap">
          AI가 도와주는 스마트한 할 일 관리 시스템에 오신 것을 환영합니다
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                placeholder="이메일을 입력하세요"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                disabled={isLoading}
                className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                disabled={isLoading}
                className="w-full border rounded-lg pl-9 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                로그인 중...
              </>
            ) : (
              '로그인 →'
            )}
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-500">아직 계정이 없으신가요?</div>
        <Link href="/signup">
          <button className="w-full mt-2 border rounded-lg py-2 text-sm hover:bg-gray-50">
            🌟 회원가입
          </button>
        </Link>
      </div>
    </div>
  );
};

/**
 * Suspense 경계로 감싼 로그인 페이지
 * useSearchParams() 사용을 위해 필수입니다.
 */
const LoginPage = () => (
  <Suspense fallback={
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  }>
    <LoginContent />
  </Suspense>
);

export default LoginPage;

# CHANGELOG

## 2026-04-06 (노트북)

### 완료
- Git 머지 충돌 해결 (`next.config.ts`, `app/page.tsx`, `app/api/ai-parse-todo/route.ts`)
- AI 파싱 API: Groq 우선 → Google Gemini fallback 구조로 변경
  - `GROQ_API_KEY` 또는 `NEXT_PUBLIC_GROQ_API_KEY` 둘 다 인식
- 템플릿 마켓 MVP 1차 구현
  - 기본 템플릿 3개 (면접/시험/업무 루틴)
  - 적용 버튼으로 입력 폼 자동 채우기
  - 현재 입력 내용을 내 템플릿으로 저장 (로컬스토리지)
  - 내 템플릿 삭제 기능
- 비로그인 UX 개선
  - 비로그인 시 안내 문구 표시
  - 저장 버튼 비활성화 + `로그인 후 저장 가능` 텍스트
  - 헤더 우측: 로그인 상태에 따라 `로그인` / `로그아웃` 버튼 분기
- Supabase URL Configuration 수정
  - Site URL: `https://ai-todo-manager-plum.vercel.app`
  - Redirect URLs: plum 도메인으로 통일

### 배포 URL
- Production: https://ai-todo-manager-plum.vercel.app
- 회원가입: https://ai-todo-manager-plum.vercel.app/signup
- 로그인: https://ai-todo-manager-plum.vercel.app/login

---

## 2026-04-07 (사무실)

### 완료
- 머지 충돌 추가 발견 및 전체 해결
  - `app/api/ai-parse-todo/route.ts`
  - `app/api/ai-todos-analysis/route.ts`
  - `lib/supabase/client.ts`
  - `types/todo.ts`
  - `tsconfig.json`
  - `package.json`
- `middleware.ts` / `proxy.ts` 중복 충돌 → `middleware.ts` 삭제로 해결
- `@ai-sdk/groq` 패키지 설치
- 빌드 정상화 완료 후 Vercel 재배포

---

## 다음 할 일

1. 무료/유료 템플릿 구분 UI
   - 무료 5개 → `적용` 가능
   - 프리미엄 → `🔒` 잠금 아이콘 + `곧 오픈` 버튼
2. 무료 기본 템플릿 5개로 확장 (현재 3개)
3. Supabase `templates` 테이블 생성 및 연결
   - `id, title, description, category, is_premium, author_id, created_at`
4. 내 템플릿 로컬스토리지 → Supabase DB로 승격 (기기 바꿔도 유지)

---

## 환경 변수 체크리스트

| 변수명 | 용도 | 필요 위치 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | 로컬 + Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 키 | 로컬 + Vercel |
| `GROQ_API_KEY` | AI 자동완성 (Groq) | 로컬 + Vercel |
| `GOOGLE_GENERATIVE_AI_API_KEY` | AI fallback (Gemini) | 로컬 + Vercel |

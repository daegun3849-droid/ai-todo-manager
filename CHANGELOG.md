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

## 2026-04-07 (노트북 - 오후)

### 완료
- **여러 일정 한 번에 입력 → 자동 분리 저장** 기능 구현
  - `app/api/ai-parse-todo/route.ts`: AI 프롬프트를 배열 반환으로 변경
  - 일정 1개 → 기존처럼 폼 자동완성
  - 일정 여러 개 → 미리보기 카드 목록 표시 후 일괄 저장
  - 개별 × 버튼으로 제거 가능
- **반응형 레이아웃 (데스크탑/모바일)** 적용
  - 데스크탑(md 이상): 2컬럼 와이드 레이아웃, 폰트·패딩 확대
  - 모바일: 기존 단일 컬럼 유지
- **로컬 `.env.local` 환경변수 수정**
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가

---

## 다음 할 일 (사무실에서 계속)

### 즉시 구현 가능
1. **월간 달력 뷰** — 일정을 월별 캘린더로 표시, 날짜 클릭 시 해당 일정 표시
2. **오늘의 명언** — 헤더 상단에 매일 다른 명언 (동기부여)

### 수익화 로드맵
3. 무료/유료 템플릿 구분 UI
   - 무료 5개 → `적용` 가능
   - 프리미엄 → `🔒` 잠금 아이콘 + `곧 오픈` 버튼
4. 무료 기본 템플릿 5개로 확장 (현재 3개)
5. **AI 주간 리포트** — 프리미엄 잠금 → 결제 유도
6. **D-Day 위젯** — 시험·면접 카운트다운, 공유 링크 생성 (바이럴)
7. Supabase `templates` 테이블 생성 및 연결
   - `id, title, description, category, is_premium, author_id, created_at`
8. 내 템플릿 로컬스토리지 → Supabase DB로 승격 (기기 바꿔도 유지)

---

## 환경 변수 체크리스트

| 변수명 | 용도 | 필요 위치 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | 로컬 + Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 키 | 로컬 + Vercel |
| `GROQ_API_KEY` | AI 자동완성 (Groq) | 로컬 + Vercel |
| `GOOGLE_GENERATIVE_AI_API_KEY` | AI fallback (Gemini) | 로컬 + Vercel |

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

## 2026-04-08 (노트북 - 오전~오후)

### 완료
- **달력 팝업 날짜 피커** — 시작/마감 날짜 입력을 달력 팝업으로 교체 (`DateTimePicker` 컴포넌트)
- **오늘의 명언** — 달력 바로 위에 매일 다른 명언 표시 (30개 순환)
- **월간 달력 뷰** — 오른쪽 컬럼에 월간 달력, 일정 있는 날짜에 초록 점 표시
- **날짜 클릭 → 빠른 일정 추가** — 달력 날짜 클릭 시 아래에 입력창 표시, Enter/추가 버튼으로 즉시 저장
- **날짜 클릭 → 일정 필터** — 해당 날짜 일정만 표시, 전체보기 버튼으로 해제
- **일정 제목 두 줄 표시** — Tailwind v4 호환 인라인 스타일로 적용, 글자 크기 15px
- **시간 표시 24시간제** — "오후 2:00" → "14시" 형식으로 변경
- **템플릿 메뉴 전면 교체** — 6개로 확장, 더 흥미롭고 실용적인 제목/내용으로 개선
  - 🌅 기분 좋은 아침 루틴
  - 🔥 집중력 폭발 딥워크
  - 💼 면접 당일 마음 정리
  - 📚 시험 전날 벼락치기
  - 💪 퇴근 후 활력 충전
  - 💡 아이디어 폭발 브레인스토밍
- **"전체 보기" 버튼** — 달력 필터 중일 때 더 눈에 띄게 디자인 개선
- **반응형 레이아웃** — 데스크탑 2컬럼(좌: 입력폼+템플릿 / 우: 명언+달력+일정목록), 모바일 단일 컬럼

### 현재 배포 상태
- GitHub: `main` 브랜치 최신 (모든 작업 푸시 완료)
- Vercel: 자동 배포 완료
- URL: https://ai-todo-manager-plum.vercel.app

---

## 다음 할 일

### 모바일 알림 기능 (논의 완료, 구현 예정)
- **방법 ① Web Push 알림 (PWA)** ← 1순위 추천
  - 홈화면 추가 후 브라우저 푸시 알림
  - 안드로이드 크롬 완벽 지원, 아이폰 iOS 16.4 이상 지원
  - 구현: 서비스워커 + VAPID 키 설정
- **방법 ② 이메일 알림 (Vercel Cron + Resend)** ← 가장 빠름
  - Vercel Cron이 매시간 체크 → 30분 후 일정 있으면 가입 이메일 발송
  - 무료 구현 가능 (Resend 무료 플랜)
- **방법 ③ 카카오 알림톡** ← 사업자 등록 필요, 나중에
- **구현 순서**: ② 이메일 먼저 → ① Web Push 추가

### 수익화 로드맵
1. 무료/유료 템플릿 구분 UI
   - 무료 5개 → `적용` 가능
   - 프리미엄 → `🔒` 잠금 아이콘 + `곧 오픈` 버튼
2. 무료 기본 템플릿 5개로 확장 (현재 3개)
3. **AI 주간 리포트** — 프리미엄 잠금 → 결제 유도
4. **D-Day 위젯** — 시험·면접 카운트다운, 공유 링크 생성 (바이럴)
5. Supabase `templates` 테이블 생성 및 연결
6. 내 템플릿 로컬스토리지 → Supabase DB로 승격 (기기 바꿔도 유지)

---

## 환경 변수 체크리스트

| 변수명 | 용도 | 필요 위치 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | 로컬 + Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 키 | 로컬 + Vercel |
| `GROQ_API_KEY` | AI 자동완성 (Groq) | 로컬 + Vercel |
| `GOOGLE_GENERATIVE_AI_API_KEY` | AI fallback (Gemini) | 로컬 + Vercel |

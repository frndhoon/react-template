# React Template

> React + Vite + TypeScript + pnpm + oxlint/fmt + tailwindcss(shadcn/ui) + React Compiler + react-router + TanStack Query + Supabase + zustand

## 시작하기

```bash
pnpm install
cp .env.example .env.local   # Supabase URL / anon key 를 채운다
pnpm dev
```

## 폴더 구조

```
src/
├─ api/
│  ├─ action/            순수 async 함수. 성공하면 데이터, 실패하면 AppError 를 throw
│  └─ tanstack-query/    queryKey 팩토리 + useQuery/useMutation 래퍼
├─ components/ui/        shadcn/ui 컴포넌트
├─ configs/              QueryClient 옵션
├─ hooks/                범용 훅 (서버 상태와 무관한 것만)
├─ lib/                  cn 등 유틸
├─ pages/                라우트 하나당 파일 하나, default export
├─ provider/             앱 전역 Provider
├─ routes/               경로 상수 + 라우터 정의
├─ services/supabase/    Supabase 클라이언트, 에러 변환, 페이지네이션
├─ store/                zustand 스토어
├─ styles/               global.css
├─ types/                공용 타입, DB 생성 타입
└─ utils/                AppError, Logger
```

## 라우팅

경로 문자열은 `@/routes/paths` 의 `PATH` 하나에만 두고, 라우트 정의와 `<Link to>` 가 같은 상수를 본다.
`ErrorPage` 는 `errorElement`(렌더 중 터진 에러)와 `*`(없는 경로) 양쪽을 겸한다.

페이지가 늘어나면 `router.tsx` 에서 코드 스플리팅한다.

```tsx
{ path: PATH.POSTS, lazy: { Component: () => import('@/pages/PostListPage').then(m => m.default) } }
```

## 예시 코드 정리

Supabase 스키마를 실제 것으로 교체하면 아래 예시 파일들은 지운다.

- `src/api/action/post.action.ts`
- `src/api/tanstack-query/post.query.ts`
- `src/store/useTestStore.ts`
- `src/hooks/useDebounce.ts`, `src/hooks/useToggle.ts`

## 스크립트

| 명령             | 설명                      |
| ---------------- | ------------------------- |
| `pnpm dev`       | 개발 서버                 |
| `pnpm build`     | 타입체크(`tsc -b`) + 빌드 |
| `pnpm lint`      | oxlint                    |
| `pnpm fmt`       | oxfmt (자동 수정)         |
| `pnpm fmt:check` | 포맷 검사만               |
| `pnpm preview`   | 빌드 결과 미리보기        |

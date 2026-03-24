# cohi-chat Frontend

1:1 미팅 예약 서비스의 프론트엔드 애플리케이션입니다.

## 기술 스택

- React 18, TypeScript
- Vite
- TanStack Router / Query
- Tailwind CSS
- pnpm

## 개발 명령어

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (port 3000)
pnpm dev

# 프로덕션 빌드
pnpm build

# 테스트 실행
pnpm test

# 린트 검사
pnpm lint
```

## Google AdSense

Google AdSense Auto ads is loaded globally from `index.html` with the publisher client script.

## 프로젝트 구조

```
src/
├── components/       # 재사용 컴포넌트
├── features/         # 도메인별 기능 모듈
│   └── {feature}/    # Bulletproof React 패턴
│       ├── api/          # API 요청
│       ├── components/   # 스코프 컴포넌트
│       ├── hooks/        # 스코프 훅
│       ├── types/        # 타입 정의
│       ├── utils/        # 유틸리티 (상수, 검증 등)
│       └── index.ts      # 배럴 파일
├── pages/            # 페이지 컴포넌트
├── hooks/            # 공통 Custom Hooks
├── routes/           # 라우트 정의
└── libs/             # 공통 유틸리티
```

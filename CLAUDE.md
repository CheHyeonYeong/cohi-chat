# cohiChat - 1:1 미팅 예약 서비스

호스트-게스트 간 미팅 예약 웹 서비스 (Google Calendar 연동)

## 기술 스택

### Backend - `/backend`
- Spring Boot 3.5, Java 21
- Spring Data JPA, Spring Security
- PostgreSQL, JWT (jjwt)
- Lombok, ModelMapper
- SpringDoc OpenAPI
- Google Calendar API

### Frontend - `/frontend`
- React 19, TypeScript
- Vite, TanStack Router/Query
- Tailwind CSS, PostCSS
- pnpm 패키지 매니저
- Vitest, Playwright (테스트)

## 개발 명령어

### Backend
```bash
cd backend
./gradlew build      # 빌드
./gradlew bootRun    # 실행 (port 8080)
./gradlew test       # 테스트
```

### Frontend
```bash
cd frontend
pnpm install    # 의존성 설치
pnpm dev        # 개발 서버 (port 3000)
pnpm build      # 프로덕션 빌드
pnpm test run   # 테스트 실행 (watch 모드 아님)
pnpm lint       # ESLint 검사
```

### Docker
```bash
docker-compose up -d    # 전체 서비스 실행
```

## 프로젝트 구조

```
cohiChat/
├── .claude/
│   ├── commands/         # 커스텀 슬래시 커맨드
│   └── skills/           # 커스텀 스킬
├── backend/              # Spring Boot 백엔드 (Java 21)
├── frontend/             # React 프론트엔드
│   └── src/
│       ├── components/   # 재사용 컴포넌트
│       ├── features/     # 도메인별 기능 모듈 (member, booking, host)
│       ├── pages/        # 페이지
│       ├── hooks/        # Custom Hooks
│       ├── routes/       # 라우트 정의
│       └── libs/         # 유틸리티
├── docs/                 # 문서
└── docker-compose.yml
```

## 프론트엔드 라우트

| 경로 | 페이지 | 인증 | 파일 |
|------|--------|------|------|
| `/` | 홈 | - | `pages/Home.tsx` |
| `/login` | 로그인 | - | `pages/Login.tsx` |
| `/signup` | 회원가입 | - | `pages/Signup.tsx` |
| `/forgot-password` | 비밀번호 찾기 | - | `pages/ForgotPassword.tsx` |
| `/reset-password` | 비밀번호 재설정 | - | `pages/ResetPassword.tsx` |
| `/terms` | 이용약관 | - | `pages/Terms.tsx` |
| `/privacy` | 개인정보처리방침 | - | `pages/Privacy.tsx` |
| `/booking/my-bookings` | 내 예약 목록 | AuthGuard | `pages/booking/MyBookings.tsx` |
| `/booking/$id` | 예약 상세/수정 | AuthGuard | `pages/booking/Detail.tsx` |
| `/host/$hostId` | 호스트 프로필 | - | `pages/host/Profile.tsx` |
| `/host/register` | 호스트 등록 | AuthGuard | `pages/host/Register.tsx` |
| `/host/timeslots` | 시간대 설정 | HostGuard | `pages/host/TimeSlotSettings.tsx` |
| `/host/settings` | 호스트 설정 | HostGuard | `pages/host/Settings.tsx` |
| `/member/settings` | 회원정보 변경 | AuthGuard | `pages/member/Settings.tsx` |
| `/oauth/callback/$provider` | OAuth 콜백 | - | `pages/oauth/CallbackPage.tsx` |

## 주의사항

### 환경 요구사항
- Java: 21
- Node.js: 22 이상

### 주요 API 엔드포인트
- API 문서: http://localhost:8080/swagger-ui.html

## 참고 링크

- [TanStack Router 문서](https://tanstack.com/router)
- [TanStack Query 문서](https://tanstack.com/query)
- [Spring Boot 문서](https://spring.io/projects/spring-boot)

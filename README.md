# coheChat - 1:1 미팅 예약 서비스

호스트와 게스트 간의 미팅 예약을 관리하는 웹 서비스입니다. Google Calendar와 연동하여 자동으로 일정을 관리합니다.

## 기술 스택

### Backend
- Spring Boot 3.5, Java 21
- Spring Data JPA, Spring Security
- SQLite, JWT (jjwt)
- SpringDoc OpenAPI
- Google Calendar API

### Frontend
- React 18, TypeScript
- Vite, TanStack Router/Query
- Tailwind CSS
- pnpm

## 빠른 시작

### 사전 요구사항
- Java 21
- Node.js 18+
- pnpm

### 실행

```bash
# 백엔드
cd backend
./gradlew bootRun    # http://localhost:8080

# 프론트엔드
cd frontend
pnpm install
pnpm dev             # http://localhost:3000
```

### Docker
```bash
docker-compose up -d
```

## 프로젝트 구조

```
coheChat/
├── backend/          # Spring Boot 백엔드
├── frontend/         # React 프론트엔드
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── routes/
│       └── libs/
├── docs/             # 문서
└── docker-compose.yml
```

## API 문서

- Swagger UI: http://localhost:8080/swagger-ui.html

## 팀

| FullStack | FullStack |FullStack |
|:---------:|:---------:|:---------:|
| **채현영** | **김희수** | **박천** |
| [@CheHyeonYeong](https://github.com/CheHyeonYeong) | [@Tarte12](https://github.com/Tarte12) |[@say8425](https://github.com/say8425) |

## 라이선스

MIT License

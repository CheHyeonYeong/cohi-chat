# coheChat - 1:1 미팅 예약 서비스

호스트와 게스트 간의 미팅 예약을 손쉽게 관리하는 웹 서비스입니다. Google Calendar와 연동하여 자동으로 일정을 관리하고, 직관적인 UI로 예약 프로세스를 간소화합니다.

## 📖 프로젝트 소개

### 개요
"커피챗(coheChat)"은 호스트가 자신의 가용 시간을 등록하면, 게스트가 해당 시간대에 미팅을 예약할 수 있는 서비스입니다. FastAPI와 React를 기반으로 구축되었으며, Google Calendar API를 통해 자동으로 캘린더 이벤트를 생성합니다.

### 프로젝트 기간
**2024.12.19 ~ 2026.01.31**

### 주요 목표
- FastAPI → Spring Boot 백엔드 마이그레이션 진행 중
- AWS EC2 1GB 환경에서의 효율적인 배포
- Google Calendar 연동을 통한 실시간 일정 관리

## ✨ 주요 기능

### 🎯 호스트 기능
- **캘린더 설정**: 미팅 주제 및 설명 등록
- **가용 시간 관리**: 요일별 타임슬롯 설정 (예: 월/수/금 14:00-15:00)
- **예약 현황 조회**: 실시간 예약 현황 및 스트리밍 조회
- **Google Calendar 연동**: 예약 시 자동으로 캘린더 이벤트 생성
- **예약 관리**: 예약 수정, 참석 상태 관리

### 👤 게스트 기능
- **호스트 검색**: username으로 호스트 캘린더 조회
- **가용 시간 확인**: 예약 가능한 날짜 및 시간대 조회
- **예약 생성**: 원하는 시간대에 미팅 예약
- **예약 관리**: 내 예약 목록 조회, 수정, 취소
- **파일 업로드**: 예약 관련 자료 첨부

## 🛠 기술 스택

### Backend (Spring Boot)
- **Spring Boot 3.5** - Java 웹 프레임워크
- **Java 21** - LTS 버전
- **Spring Data JPA** - ORM
- **Spring Security** - 인증/인가
- **SQLite** - 경량 데이터베이스
- **JWT (jjwt)** - 토큰 기반 인증
- **SpringDoc OpenAPI** - API 문서 자동 생성

### Backend (Python - 마이그레이션 원본)
- **FastAPI** - 고성능 Python 웹 프레임워크
- **SQLModel** - SQLAlchemy 기반 ORM
- **SQLite** - 경량 데이터베이스 (개발/운영)
- **Alembic** - 데이터베이스 마이그레이션
- **JWT** - 토큰 기반 인증
- **Google Calendar API** - 캘린더 자동 연동
- **Poetry** - 의존성 관리

### Frontend
- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **TanStack Router** - 파일 기반 라우팅
- **TanStack Query** - 서버 상태 관리
- **Tailwind CSS** - 유틸리티 CSS 프레임워크
- **pnpm** - 빠른 패키지 매니저

## 🚀 빠른 시작

### 사전 요구사항
- **Python 3.11-3.13** (3.14는 일부 패키지 호환 문제)
- **Node.js 18 이상**
- **pnpm** - `npm install -g pnpm`

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd coheChat
```

### 2. 백엔드 설정

#### 의존성 설치
```bash
# Poetry 사용 (권장)
poetry install

# 또는 pip 직접 사용
pip install "fastapi[all]" sqlmodel sqlalchemy-utc aiosqlite alembic \
  greenlet "python-jose[cryptography]" "pwdlib[argon2,bcrypt]" uvicorn \
  "fastapi-storages" sqladmin google-api-python-client python-dotenv
```

#### 환경 변수 설정
프로젝트 루트에 `.env` 파일 생성:

```env
# 필수
DATABASE_URL=sqlite+aiosqlite:///./local.db

# 필수 - Google Calendar 연동 시
GOOGLE_CALENDAR_ID=your-email@gmail.com

# 선택사항 - 에러 모니터링
SENTRY_DSN=your-sentry-dsn

# 선택사항 - CORS 설정 (프로덕션)
ALLOWED_ORIGINS=http://localhost:3000
```

#### 데이터베이스 초기화
```bash
# 필수 디렉토리 생성
mkdir -p static uploads

# 마이그레이션 실행
python -m alembic upgrade head
```

### 3. 프론트엔드 설정
```bash
cd frontend
pnpm install
cd ..
```

### 4. 서버 실행

**옵션 A - Spring Boot 백엔드:**
```bash
cd backend
./gradlew bootRun
```

**옵션 B - FastAPI 백엔드:**
```bash
python -m uvicorn appserver.app:app --reload --port 8000
```

**프론트엔드:**
```bash
cd frontend
pnpm dev
```

### 5. 접속
- **프론트엔드**: http://localhost:3000
- **API 문서 (Spring Boot)**: http://localhost:8080/swagger-ui.html
- **API 문서 (FastAPI)**: http://localhost:8000/docs
- **관리자 페이지**: http://localhost:8000/@/-_-/@/nimda/

## 🔧 Google Calendar 연동 설정

Google Calendar와 연동하려면 Service Account 설정이 필요합니다:

### 1. Service Account 생성
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성 또는 선택
3. **APIs & Services** → **Credentials**
4. **Create Credentials** → **Service Account**
5. Service Account 생성 후 **Keys** 탭에서 JSON 키 생성
6. 다운로드한 JSON 파일을 프로젝트 루트에 `calendar-booking-service-account-credentials.json`으로 저장

### 2. Calendar API 활성화
1. **APIs & Services** → **Library**
2. "Google Calendar API" 검색 후 활성화

### 3. 캘린더 공유 설정
1. [Google Calendar](https://calendar.google.com) 접속
2. 사용할 캘린더 선택 → **설정 및 공유**
3. **특정 사용자와 공유** 섹션에서 Service Account 이메일 추가
   - 이메일: JSON 파일의 `client_email` 값
   - 권한: **일정 변경 권한** 선택

### 4. `.env` 파일 업데이트
```env
GOOGLE_CALENDAR_ID=your-email@gmail.com
```

## 📁 프로젝트 구조

```
coheChat/
├── backend/                   # Spring Boot 백엔드 (Java 21)
├── backend-python/            # FastAPI 백엔드 (마이그레이션 원본)
│   ├── appserver/
│   │   ├── apps/
│   │   │   ├── account/      # 사용자 인증 및 계정 관리
│   │   │   └── calendar/     # 캘린더 및 예약 관리
│   │   ├── libs/
│   │   │   ├── google/       # Google Calendar API 통합
│   │   │   ├── datetime/     # 날짜/시간 유틸리티
│   │   │   └── collections/  # 컬렉션 유틸리티
│   │   ├── app.py            # FastAPI 애플리케이션
│   │   ├── db.py             # 데이터베이스 설정
│   │   └── admin.py          # Admin 페이지 설정
│   ├── alembic/              # DB 마이그레이션
│   └── tests/                # 테스트 코드
│
├── frontend/                  # 프론트엔드
│   └── src/
│       ├── components/       # 재사용 가능한 컴포넌트
│       ├── pages/            # 페이지 컴포넌트
│       ├── hooks/            # Custom React Hooks
│       ├── routes/           # 라우트 정의
│       └── libs/             # 유틸리티 함수
│
├── docs/                      # 문서
├── CLAUDE.md                  # Claude Code 프로젝트 컨텍스트
├── docker-compose.yml         # Docker 설정
├── static/                    # 정적 파일
├── uploads/                   # 업로드 파일 저장소
└── local.db                   # SQLite 데이터베이스
```

## 🔌 주요 API 엔드포인트

### 인증
- `POST /account/signup` - 회원가입
- `POST /account/login` - 로그인
- `GET /account/@me` - 내 정보 조회
- `PATCH /account/@me` - 내 정보 수정
- `DELETE /account/unregister` - 회원 탈퇴

### 캘린더
- `POST /calendar` - 캘린더 생성 (호스트)
- `GET /calendar/{username}` - 캘린더 조회
- `PATCH /calendar` - 캘린더 수정 (호스트)

### 타임슬롯
- `POST /time-slots` - 가용 시간 생성 (호스트)
- `GET /time-slots/{username}` - 가용 시간 조회

### 예약
- `POST /bookings/{username}` - 예약 생성 (게스트)
- `GET /bookings` - 내 예약 목록 (게스트)
- `GET /calendar/{username}/bookings` - 호스트 예약 조회
- `PATCH /bookings/{id}` - 예약 수정 (호스트)
- `PATCH /guest-bookings/{id}` - 예약 수정 (게스트)
- `DELETE /guest-bookings/{id}` - 예약 취소 (게스트)
- `POST /bookings/{id}/upload` - 파일 업로드

자세한 API 문서는 서버 실행 후 http://localhost:8000/docs 참고

## 🧪 테스트

```bash
# 백엔드 테스트
pytest

# 프론트엔드 테스트
cd frontend
pnpm test
```

## ⚠️ 알려진 이슈 및 해결

### 1. 환경 변수 로딩
**증상**: `.env` 파일의 값이 로드되지 않음

**해결**: `appserver/app.py`에 `load_dotenv()` 추가됨 (v1.1.0)

### 2. Google Calendar 이벤트 생성 실패
**증상**: 예약 생성은 되지만 `google_event_id`가 null

**원인**:
- Service Account credentials 미설정
- 캘린더 공유 권한 부족
- 백그라운드 태스크 세션 문제

**해결**:
- Google Calendar 연동 설정 참고
- v1.1.0에서 백그라운드 태스크 세션 처리 개선됨

### 3. 무한 루프 오류 (프론트엔드)
**증상**: `useBookingsStreamQuery`, `useCalendarDateSelection`에서 무한 요청

**해결**: useCallback 의존성 배열 최적화 (v1.1.0)

### 4. 연도 제한
**증상**: 2026년 이후 예약 불가 (422 에러)

**해결**: 연도 검증 범위 2100년까지 확장 (v1.1.0)

## 🔒 보안 주의사항

**프로덕션 배포 전 필수 조치:**

1. ✅ `SECRET_KEY` 환경 변수로 관리
2. ✅ Sentry DSN 환경 변수로 관리
3. ✅ CORS를 특정 도메인으로 제한
4. ✅ `.env`, `local.db`, `*.json` (credentials) `.gitignore` 추가
5. ⚠️ `appserver/apps/account/deps.py:26` 토큰 검증 로직 수정 필요:
   ```python
   # 현재 (잘못됨)
   if now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES) < expires_at:
       raise ExpiredTokenError()

   # 수정 필요
   if now > expires_at:
       raise ExpiredTokenError()
   ```

## 👥 팀 소개

### 팀 구성

|         **FullStack**         |         **FullStack**          |
| :-------------------------: | :--------------------------: |
|      ![채현영][chehyeonyeong]      |      ![김희수][kimheesu]      |
| **채현영** | **김희수** |
|   _"열린 자세로 배우기"_    |     _"바로 서버 정상화"_     |

### 협업 규칙

1. **깃허브 중심 협업** - 모든 문서화는 GitHub README로 작성
2. **주 1회 정기 회의** - 회의록은 GitHub에 기록
3. **API 문서** - http://localhost:8000/docs 자동 생성
4. **브랜치 전략** - feature 브랜치에서 작업 후 PR
5. **코드 리뷰** - Pn 룰 적용 (아래 참고)

### 코드 리뷰 문화

[뱅크샐러드의 Pn 룰](https://blog.banksalad.com/tech/banksalad-code-review-culture/)을 도입하여 효과적인 코드 리뷰를 진행합니다.

| 우선순위 | 설명 | 예시 |
|---------|------|------|
| **P5** | 제안사항, 반영 선택 | P5: 이렇게 리팩토링하면 더 좋을 것 같아요 |
| **P4** | 가벼운 제안 | P4: 변수명을 더 명확하게 바꿔보는 건 어떨까요? |
| **P3** | 중요한 개선사항 | P3: 경계값 테스트 추가가 필요해 보입니다 |
| **P2** | 반드시 반영 필요 | P2: 무한 루프 가능성이 있습니다. 수정 필요 |
| **P1** | 즉각 수정 필수 | P1: 비즈니스 로직 오류. 배포 전 필수 수정 |

### 기술 공유

- 매주 자율 기술 세미나 진행
- 팀원 모두가 자유 주제로 학습 내용 공유
- 지식의 휘발을 막고 팀 전체의 성장 추구

## 📝 변경 이력

### v1.1.0 (2024.12.23)
- ✨ Google Calendar 연동 안정화
- 🐛 환경 변수 로딩 문제 수정
- 🐛 프론트엔드 무한 루프 수정
- 🐛 백그라운드 태스크 세션 처리 개선
- ✨ 연도 제한 2100년까지 확장

### v1.0.0 (2024.12.19)
- 🎉 초기 릴리스
- ✨ 사용자 인증 및 계정 관리
- ✨ 캘린더 및 타임슬롯 관리
- ✨ 예약 생성/수정/삭제
- ✨ Google Calendar 기본 연동

## 📄 라이선스

MIT License

## 📮 문의

프로젝트 관련 문의는 Issues 탭을 이용해주세요.

---

**Made with ❤️ by coheChat Team**

[chehyeonyeong]: https://github.com/cheHyeonYeong
[kimheesu]: https://github.com/Tarte12

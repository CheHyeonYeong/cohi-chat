# coheChat - 약속잡기 서비스

호스트와 게스트 간의 미팅 예약을 관리하는 웹 서비스입니다. 호스트는 자신의 가용 시간대를 설정하고, 게스트는 해당 시간대에 예약을 생성할 수 있습니다.

## 기술 스택

### 백엔드
- **FastAPI** - Python 웹 프레임워크
- **SQLModel** - SQLAlchemy 기반 ORM
- **SQLite** - 데이터베이스 (개발용)
- **Alembic** - 데이터베이스 마이그레이션
- **Poetry** - Python 패키지 관리
- **JWT** - 인증/인가
- **Google Calendar API** - 캘린더 통합

### 프론트엔드
- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **TanStack Router** - 라우팅
- **TanStack Query** - 서버 상태 관리
- **Tailwind CSS** - 스타일링
- **pnpm** - 패키지 관리

## 사전 요구사항

- **Python 3.11 이상** (3.14는 일부 패키지 호환성 문제 있음, 3.11-3.13 권장)
- **Node.js 18 이상**
- **pnpm** (npm install -g pnpm)
- **Poetry** (pip install poetry) - 선택사항, pip도 가능

## 설치 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd cohi-chat
```

### 2. 백엔드 설정

```bash
# Poetry 사용 시
poetry install

# 또는 pip 직접 사용
pip install "fastapi[all]" sqlmodel sqlalchemy-utc aiosqlite alembic greenlet "python-jose[cryptography]" "pwdlib[argon2,bcrypt]" uvicorn "fastapi-storages" sqladmin google-api-python-client
```

### 3. 데이터베이스 초기화

```bash
# 필수 디렉토리 생성
mkdir -p static uploads

# 데이터베이스 마이그레이션 실행
python -m alembic upgrade head
```

### 4. 프론트엔드 설정

```bash
cd frontend
pnpm install
cd ..
```

## 실행 방법

### 개발 모드

**터미널 1 - 백엔드 서버:**
```bash
# 프로젝트 루트에서
python -m uvicorn appserver.app:app --reload --port 8000
```

**터미널 2 - 프론트엔드 서버:**
```bash
cd frontend
pnpm dev
```

### 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8000
- **API 문서 (Swagger)**: http://localhost:8000/docs
- **Admin 페이지**: http://localhost:8000/@/-_-/@/nimda/

## 주요 기능

### 사용자 관리
- 회원가입 / 로그인
- 사용자 프로필 관리
- 호스트 / 게스트 역할 구분

### 캘린더 관리 (호스트)
- 캘린더 생성 및 설정
- 가용 시간대(TimeSlot) 설정
- Google Calendar 연동
- 예약 현황 조회

### 예약 관리
- 예약 생성 (게스트)
- 예약 수정 / 취소
- 파일 업로드 (예약 관련 자료)
- 참석 상태 관리

## 환경 변수

프로젝트 루트에 `.env` 파일을 생성하세요:

```env
# 백엔드 설정
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite+aiosqlite:///./local.db

# Google Calendar API (선택사항)
GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com

# Sentry (선택사항)
SENTRY_DSN=your-sentry-dsn

# CORS (프로덕션)
ALLOWED_ORIGINS=http://localhost:3000
```

## 프로젝트 구조

```
coheChat/
├── appserver/              # 백엔드 소스
│   ├── apps/
│   │   ├── account/       # 사용자 계정 관리
│   │   └── calendar/      # 캘린더/예약 관리
│   ├── libs/              # 공통 라이브러리
│   ├── app.py             # FastAPI 앱
│   └── db.py              # DB 설정
├── frontend/              # 프론트엔드 소스
│   └── src/
│       ├── components/    # 재사용 컴포넌트
│       ├── pages/         # 페이지 컴포넌트
│       ├── hooks/         # React hooks
│       ├── routes/        # 라우트 설정
│       └── libs/          # 유틸리티
├── alembic/               # DB 마이그레이션
├── tests/                 # 테스트 코드
├── static/                # 정적 파일
├── uploads/               # 업로드 파일
└── local.db               # SQLite DB (생성됨)
```

## API 엔드포인트

### 인증
- `POST /account/signup` - 회원가입
- `POST /account/login` - 로그인
- `DELETE /account/unregister` - 회원탈퇴

### 사용자
- `GET /account/@me` - 내 정보 조회
- `GET /account/users/{username}` - 사용자 정보 조회
- `PATCH /account/@me` - 내 정보 수정

### 캘린더
- `GET /calendar/{host_username}` - 호스트 캘린더 조회
- `POST /calendar` - 캘린더 생성 (호스트)
- `PATCH /calendar` - 캘린더 수정 (호스트)
- `GET /calendar/{host_username}/bookings` - 예약 목록 조회

### 타임슬롯
- `POST /time-slots` - 시간대 생성 (호스트)
- `GET /time-slots/{host_username}` - 시간대 목록 조회

### 예약
- `POST /bookings/{host_username}` - 예약 생성 (게스트)
- `GET /bookings/{booking_id}` - 예약 상세 조회
- `PATCH /bookings/{booking_id}` - 예약 수정 (호스트)
- `PATCH /guest-bookings/{booking_id}` - 예약 수정 (게스트)
- `DELETE /guest-bookings/{booking_id}` - 예약 취소 (게스트)
- `POST /bookings/{booking_id}/upload` - 파일 업로드

자세한 API 문서는 http://localhost:8000/docs 에서 확인하세요.

## 테스트

```bash
# 백엔드 테스트
pytest

# 프론트엔드 테스트
cd frontend
pnpm test
```

## 알려진 이슈

### 1. 토큰 검증 버그 (중요)
`appserver/apps/account/deps.py:26` 의 토큰 만료 검증 로직이 반대로 되어 있습니다.

**현재 코드 (잘못됨):**
```python
if now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES) < expires_at:
    raise ExpiredTokenError()
```

**수정 필요:**
```python
if now > expires_at:
    raise ExpiredTokenError()
```

### 2. Python 3.14 호환성
Python 3.14는 일부 의존성 패키지와 호환성 문제가 있습니다. Python 3.11-3.13 사용을 권장합니다.

### 3. OpenAPI 스키마 생성 오류
`fastapi-storages`의 `StorageFile` 타입이 Pydantic v2와 호환 문제가 있어 `/openapi.json` 엔드포인트에서 500 에러가 발생합니다. 현재 임시 수정으로 `BookingFileOut`에서 `file` 필드를 제거했습니다.

## 보안 주의사항

**프로덕션 배포 전 반드시 수정:**

1. `SECRET_KEY`를 환경 변수로 관리
2. Sentry DSN을 환경 변수로 관리
3. CORS 설정을 특정 도메인으로 제한
4. `.env` 파일을 `.gitignore`에 추가 확인
5. 위의 토큰 검증 버그 수정
6. `local.db`를 `.gitignore`에 추가

## 라이선스

(라이선스 정보 추가)

## 기여

(기여 가이드라인 추가)

## 문의




## 📖 프로젝트 소개

### 개요
커피챗
기획에서 출시까지 FastAPI 개발 백서를 기반으로 spring java migration 진행 및 AWS 1GB으로 배포목표

### 프로젝트 기간

`251219 ~ 260131`

### 프로젝트 비전(MVP)


## ✨ 주요 기능


## 🛠 기술 스택
java spring
react
sqllite

## 🏗️ 인프라 아키텍처


## 👥 팀 소개
### 팀 규칙
1. 우리는 깃허브 외에 볼거리 만들지 않기 제발
2. 회의록=> 깃허브 readme로 작성하기, 회의 주기-> 주1회
3. api명세서는 http://[ip]/docs
4. ci/cd -> 깃액션(젠킨스)
5. 브랜치전략
6. qa서버
7. 운영서버
8. DB -> dbeaver // connection pool 정보
9. git prj

### 프로젝트 팀 구성 및 역할

|         **FullStack**         |         **FullStack**          |    
| :-------------------------: | :--------------------------: | 
|      ![채현영][chehyeonyeong]      |      ![김희수][]      | 
| **[채현영][musung_g]** | **[김희수][sungyun_g]** |
|   _"열린 자세로 배우기"_    |     _"바로 서버 정상화"_     | 

### 코드리뷰 문화

저희는 [뱅크샐러드의 코드리뷰 방법으로 유명한 Pn룰](https://blog.banksalad.com/tech/banksalad-code-review-culture/)을 적극적으로 도입하여 효과적이고 건설적인 코드리뷰 문화를 만들어가려 노력하고 있어요.
도입하게된 계기는 아래와 같은 점들이에요.

- 비언어적인 표현전달의 한계로 의사 전달의 불확실성의 우려
- 왜곡될 수 있는 강조 및 감정 표현 예방
- 적극적이고 상호 배려하는 코드 리뷰 문화 조성

모든 리뷰어들은 피드백 의견의 강도에 따라 P5 ~ P1을 먼저 코멘트에 밝혀요.
모든 리뷰어는 피드백 의견의 강도에 따라 아래와 같이 P5부터 P1까지의 우선순위를 코멘트 앞에 명시합니다:

<table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; text-align: left; width: 100%;">
  <thead>
    <tr style="background-color: #f2f2f2;">
      <th style="width: 20%;">우선순위</th>
      <th style="width: 35%;">설명</th>
      <th style="width: 45%;">예제</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>P5<br>(질문 및 추천)</strong></td>
      <td>제안사항으로, 반드시 반영할 필요는 없습니다.</td>
      <td>P5 - 이런 식으로 리팩토링하면 더 간결해질 수 있을 것 같아요.</td>
    </tr>
    <tr>
      <td><strong>P4<br>(가벼운 제안)</strong></td>
      <td>가급적 고려되길 권장하지만 반드시 수정할 필요는 없습니다.</td>
      <td>P4: 변수명을 조금 더 명확하게 바꿔보는 건 어떨까요?</td>
    </tr>
    <tr>
      <td><strong>P3<br>(중요)</strong></td>
      <td>비교적 기능에 영향을 미칠 수 있는 가능성이 미미하게 존재해 수정을 적극적으로 고려해야 합니다. <br>중요한 개선 사항이거나 모호한 부분에 대한 질문입니다.</td>
      <td>P3) 이 로직은 경계값 테스트를 추가하는 게 좋아 보여요. 의견 주세요.</td>
    </tr>
    <tr>
      <td><strong>P2<br>(매우 중요)</strong></td>
      <td>코드 품질이나 기능에 영향을 미칠 수 있는 사항으로, 반드시 반영해야 합니다.<br>P2부터는 반드시 리뷰어와 반영 여부를 논의후 결정하여야 합니다.</td>
      <td>P2) 여기서 무한 루프 가능성이 있습니다. 수정이 필요합니다.</td>
    </tr>
    <tr>
      <td><strong>P1<br>(최우선)</strong></td>
      <td>즉각 수정해야 할 중대한 문제로, 배포 시점 전에 반드시 해결되어야 합니다.</td>
      <td>P1) 이 부분은 비즈니스 로직이 잘못 구현되었습니다. 수정하지 않으면 심각한 버그가 발생할 수 있습니다.</td>
    </tr>
  </tbody>
</table>

### 기술공유 문화

프로젝트를 진행하며 이번에 집중적으로 다루며 새롭게 학습한 기술 및 지식들이나, 이번에는 미처 사용해보지 못했지만 **휘발되기 아까운 지식들이 매우 자주 생겨났습니다.** <br>
이러한 지식을 팀 내에서 공유하면 개인의 성장이 팀 전체의 성장으로 이어질 수 있다는 믿음으로, 저희는 자율적이고 활발한 지식 공유 문화를 만들었어요. <br>
![image](https://github.com/user-attachments/assets/d67c938b-aece-4bbd-ac40-6c1bec9ff30b)

- 모든 팀원이 자유주제로 조사하거나 경험한 지식을 매주 1개 이상씩 자체적인 기술 세미나 시간에 공유하며 자유롭게 토론해요 📖 <br>
- 강제적인 발표가 아닌, 배우고 나누고자 하는 열정에서 출발한 시간이기에, 모두가 즐겁게 지식을 공유하는 시간이 될 수 있었어요 ✌️

[musung]: https://avatars.githubusercontent.com/u/63047990?v=4
[sungyun]: https://avatars.githubusercontent.com/u/79460319?v=4

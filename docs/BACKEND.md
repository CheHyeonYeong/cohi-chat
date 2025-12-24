# Backend 아키텍처 문서 (Spring Boot 마이그레이션 가이드)

> 이 문서는 FastAPI로 구현된 백엔드를 Spring Boot로 마이그레이션하기 위한 상세 가이드입니다.

## 📋 목차
- [전체 아키텍처](#전체-아키텍처)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [API 엔드포인트](#api-엔드포인트)
- [비즈니스 로직](#비즈니스-로직)
- [인증/인가](#인증인가)
- [Google Calendar 연동](#google-calendar-연동)
- [Spring Boot 마이그레이션 매핑](#spring-boot-마이그레이션-매핑)

## 🏗 전체 아키텍처

### 디렉토리 구조
```
appserver/
├── apps/
│   ├── account/          # 사용자 계정 관리 모듈
│   │   ├── models.py     # User 엔티티
│   │   ├── schemas.py    # DTO (Request/Response)
│   │   ├── endpoints.py  # REST API 컨트롤러
│   │   ├── deps.py       # 의존성 주입 (DI)
│   │   └── exceptions.py # 커스텀 예외
│   │
│   └── calendar/         # 캘린더/예약 관리 모듈
│       ├── models.py     # Calendar, TimeSlot, Booking 엔티티
│       ├── schemas.py    # DTO
│       ├── endpoints.py  # REST API 컨트롤러
│       ├── deps.py       # DI
│       ├── enums.py      # Enum 정의
│       └── exceptions.py # 커스텀 예외
│
├── libs/                 # 공통 라이브러리
│   ├── google/
│   │   └── calendar/     # Google Calendar API 통합
│   ├── datetime/         # 날짜/시간 유틸리티
│   └── collections/      # 컬렉션 유틸리티
│
├── app.py                # FastAPI 애플리케이션 진입점
├── db.py                 # 데이터베이스 설정
└── admin.py              # Admin 페이지
```

### 레이어 아키텍처
```
┌─────────────────────────────────────┐
│     endpoints.py (Controller)       │  ← REST API 엔드포인트
├─────────────────────────────────────┤
│     schemas.py (DTO)                │  ← Request/Response 객체
├─────────────────────────────────────┤
│     (Service Layer - 현재 없음)     │  ← ⚠️ Spring Boot에서 추가 필요
├─────────────────────────────────────┤
│     models.py (Entity/Repository)   │  ← 데이터베이스 엔티티
├─────────────────────────────────────┤
│     db.py (Database)                │  ← SQLAlchemy/SQLModel
└─────────────────────────────────────┘
```

**⚠️ 주의**: 현재 FastAPI 구현에는 Service 레이어가 없고, Controller(endpoints)에서 직접 DB 접근합니다. Spring Boot 마이그레이션 시 Service 레이어 추가를 권장합니다.

## 💾 데이터베이스 스키마

### ERD
```
┌─────────────┐         ┌──────────────┐
│    User     │────1:1──│   Calendar   │
└─────────────┘         └──────────────┘
      │                        │
      │ 1:N                    │ 1:N
      │                        │
      ▼                        ▼
┌─────────────┐         ┌──────────────┐
│   Booking   │────N:1──│   TimeSlot   │
└─────────────┘         └──────────────┘
      │
      │ 1:N
      │
      ▼
┌─────────────┐
│ BookingFile │
└─────────────┘
```

### 1. User (사용자)
**파일**: `appserver/apps/account/models.py`

| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | Integer | PK, AUTO_INCREMENT | 사용자 ID |
| username | String(50) | UNIQUE, NOT NULL | 로그인 ID |
| display_name | String(50) | NOT NULL | 표시 이름 |
| email | String(255) | UNIQUE, NOT NULL | 이메일 |
| hashed_password | String | NOT NULL | 암호화된 비밀번호 |
| is_host | Boolean | DEFAULT FALSE | 호스트 여부 |
| created_at | DateTime | NOT NULL, DEFAULT NOW() | 생성일시 |
| updated_at | DateTime | NOT NULL, DEFAULT NOW() | 수정일시 |

**관계**:
- `calendar`: Calendar (1:1)
- `bookings`: List<Booking> (1:N, 게스트로서의 예약)

**인덱스**:
- `idx_username`: username
- `idx_email`: email

### 2. Calendar (캘린더)
**파일**: `appserver/apps/calendar/models.py`

| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | Integer | PK, AUTO_INCREMENT | 캘린더 ID |
| topics | JSON | NOT NULL | 미팅 주제 목록 (List<String>) |
| description | Text | NOT NULL | 캘린더 설명 |
| google_calendar_id | String(1024) | NOT NULL | Google Calendar ID (이메일) |
| host_id | Integer | FK(User.id), UNIQUE | 호스트 사용자 ID |
| created_at | DateTime | NOT NULL, DEFAULT NOW() | 생성일시 |
| updated_at | DateTime | NOT NULL, DEFAULT NOW() | 수정일시 |

**관계**:
- `host`: User (N:1)
- `time_slots`: List<TimeSlot> (1:N)

### 3. TimeSlot (가용 시간대)
**파일**: `appserver/apps/calendar/models.py`

| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | Integer | PK, AUTO_INCREMENT | 타임슬롯 ID |
| start_time | Time | NOT NULL | 시작 시간 (HH:mm:ss) |
| end_time | Time | NOT NULL | 종료 시간 (HH:mm:ss) |
| weekdays | JSON | NOT NULL | 요일 목록 (List<Integer>, 0=월~6=일) |
| calendar_id | Integer | FK(Calendar.id) | 캘린더 ID |
| created_at | DateTime | NOT NULL, DEFAULT NOW() | 생성일시 |
| updated_at | DateTime | NOT NULL, DEFAULT NOW() | 수정일시 |

**관계**:
- `calendar`: Calendar (N:1)
- `bookings`: List<Booking> (1:N)

**검증 규칙**:
- `start_time < end_time`
- `weekdays` 각 원소는 0~6 범위

### 4. Booking (예약)
**파일**: `appserver/apps/calendar/models.py`

| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | Integer | PK, AUTO_INCREMENT | 예약 ID |
| when | Date | NOT NULL | 예약 날짜 |
| topic | String | NOT NULL | 미팅 주제 |
| description | Text | NOT NULL | 예약 설명 |
| attendance_status | String | NOT NULL, DEFAULT 'SCHEDULED' | 참석 상태 |
| time_slot_id | Integer | FK(TimeSlot.id) | 타임슬롯 ID |
| guest_id | Integer | FK(User.id) | 게스트 사용자 ID |
| google_event_id | String(64) | NULLABLE | Google Calendar Event ID |
| created_at | DateTime | NOT NULL, DEFAULT NOW() | 생성일시 |
| updated_at | DateTime | NOT NULL, DEFAULT NOW() | 수정일시 |

**관계**:
- `time_slot`: TimeSlot (N:1)
- `guest`: User (N:1)
- `host`: User (computed, time_slot.calendar.host)
- `files`: List<BookingFile> (1:N)

**Enum - AttendanceStatus**:
- `SCHEDULED`: 예정
- `COMPLETED`: 완료
- `CANCELED`: 취소
- `NO_SHOW`: 노쇼

**검증 규칙**:
- `when`의 weekday가 `time_slot.weekdays`에 포함되어야 함
- 동일 게스트가 같은 날짜/타임슬롯에 중복 예약 불가
- 과거 날짜 예약 불가

### 5. BookingFile (예약 첨부파일)
**파일**: `appserver/apps/calendar/models.py`

| 필드 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | Integer | PK, AUTO_INCREMENT | 파일 ID |
| booking_id | Integer | FK(Booking.id) | 예약 ID |
| file | StorageFile | NOT NULL | 파일 정보 (fastapi-storages) |

**관계**:
- `booking`: Booking (N:1)

**파일 저장**:
- 경로: `uploads/bookings/`
- Spring Boot 마이그레이션 시 MultipartFile 및 파일 스토리지 구현 필요

## 🔌 API 엔드포인트

### 인증/계정 관리 (AccountRouter)
**파일**: `appserver/apps/account/endpoints.py`

#### 1. POST /account/signup
회원가입

**Request Body**:
```json
{
  "username": "string (5-20자)",
  "display_name": "string (2-20자)",
  "email": "user@example.com",
  "password": "string (8자 이상)",
  "is_host": false
}
```

**Response**: `201 CREATED`
```json
{
  "id": 1,
  "username": "johndoe",
  "display_name": "John Doe",
  "email": "john@example.com",
  "is_host": false,
  "created_at": "2024-12-23T10:00:00Z",
  "updated_at": "2024-12-23T10:00:00Z"
}
```

**비즈니스 로직**:
1. username, email 중복 확인
2. 비밀번호 해싱 (Argon2)
3. User 엔티티 생성
4. is_host=true면 Calendar 자동 생성 (빈 topics, description)

**예외**:
- `409 CONFLICT`: username 또는 email 중복

#### 2. POST /account/login
로그인

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**: `200 OK`
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

**비즈니스 로직**:
1. username으로 User 조회
2. 비밀번호 검증
3. JWT 토큰 생성 (payload: sub=username, display_name, is_host, exp)
4. 토큰 반환

**예외**:
- `401 UNAUTHORIZED`: 인증 실패

**JWT 페이로드**:
```json
{
  "sub": "johndoe",
  "display_name": "John Doe",
  "is_host": false,
  "exp": 1735891200
}
```

**JWT 설정**:
- Algorithm: HS256
- Expiration: 30일 (ACCESS_TOKEN_EXPIRE_MINUTES)
- Secret Key: 환경 변수 `SECRET_KEY`

#### 3. GET /account/@me
내 정보 조회

**Headers**: `Authorization: Bearer {token}`

**Response**: `200 OK`
```json
{
  "id": 1,
  "username": "johndoe",
  "display_name": "John Doe",
  "email": "john@example.com",
  "is_host": false,
  "created_at": "2024-12-23T10:00:00Z",
  "updated_at": "2024-12-23T10:00:00Z"
}
```

#### 4. PATCH /account/@me
내 정보 수정

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "display_name": "New Name",  // optional
  "email": "new@example.com",  // optional
  "password": "newpassword123" // optional
}
```

**Response**: `200 OK` (수정된 User 정보)

**비즈니스 로직**:
1. 현재 사용자 조회
2. 제공된 필드만 업데이트
3. email 변경 시 중복 확인
4. password 변경 시 재해싱

#### 5. DELETE /account/unregister
회원 탈퇴

**Headers**: `Authorization: Bearer {token}`

**Response**: `204 NO CONTENT`

**비즈니스 로직**:
1. 현재 사용자 조회
2. 연관된 데이터 cascade 삭제 (Calendar, Booking 등)
3. User 삭제

### 캘린더 관리 (CalendarRouter)

#### 6. POST /calendar
캘린더 생성 (호스트 전용)

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "topics": ["프로젝트 상담", "기술 멘토링"],  // 최소 1개
  "description": "설명 텍스트 (최소 10자)",
  "google_calendar_id": "user@gmail.com"
}
```

**Response**: `201 CREATED`

**비즈니스 로직**:
1. 사용자가 호스트인지 확인
2. 이미 캘린더가 있는지 확인
3. topics 중복 제거 및 정렬
4. Calendar 생성

**예외**:
- `403 FORBIDDEN`: 호스트가 아님
- `409 CONFLICT`: 이미 캘린더 존재

#### 7. GET /calendar/{host_username}
호스트 캘린더 조회

**Path Parameter**: `host_username` (호스트의 username)

**Response**: `200 OK`
```json
{
  "topics": ["프로젝트 상담", "기술 멘토링"],
  "description": "캘린더 설명"
}
```

**본인 호스트인 경우 추가 정보 반환**:
```json
{
  "topics": [...],
  "description": "...",
  "host_id": 1,
  "google_calendar_id": "user@gmail.com",
  "created_at": "...",
  "updated_at": "..."
}
```

#### 8. PATCH /calendar
캘린더 수정 (호스트 전용)

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "topics": ["새 주제"],           // optional
  "description": "새 설명",        // optional
  "google_calendar_id": "new@gmail.com"  // optional
}
```

**Response**: `200 OK`

### 타임슬롯 관리

#### 9. POST /time-slots
타임슬롯 생성 (호스트 전용)

**Headers**: `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "start_time": "14:00:00",
  "end_time": "15:00:00",
  "weekdays": [0, 2, 4]  // 월, 수, 금
}
```

**Response**: `201 CREATED`

**비즈니스 로직**:
1. 사용자가 호스트이고 캘린더가 있는지 확인
2. start_time < end_time 검증
3. weekdays 값이 0~6 범위인지 검증
4. 같은 캘린더에 시간대 겹치는 타임슬롯 있는지 확인 (SQLite/PostgreSQL 각각 다른 로직)
5. TimeSlot 생성

**시간대 겹침 검사**:
- SQLite: Python에서 weekdays 교집합 확인
- PostgreSQL: JSONB 연산자 사용

**예외**:
- `400 BAD_REQUEST`: 검증 실패
- `409 CONFLICT`: 시간대 겹침

#### 10. GET /time-slots/{host_username}
타임슬롯 목록 조회

**Path Parameter**: `host_username`
**Query Parameter**: `year`, `month`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "start_time": "14:00:00",
    "end_time": "15:00:00",
    "weekdays": [0, 2, 4],
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### 예약 관리

#### 11. POST /bookings/{host_username}
예약 생성 (게스트)

**Headers**: `Authorization: Bearer {token}`
**Path Parameter**: `host_username`

**Request Body**:
```json
{
  "when": "2025-01-15",
  "topic": "프로젝트 상담",
  "description": "상담 내용 설명",
  "time_slot_id": 1
}
```

**Response**: `201 CREATED`

**비즈니스 로직**:
1. 호스트 존재 확인
2. 자기 자신에게 예약 불가 확인
3. 과거 날짜 예약 불가 확인
4. TimeSlot 존재 및 when의 weekday가 타임슬롯의 weekdays에 포함되는지 확인
5. 중복 예약 확인 (같은 게스트, 같은 날짜, 같은 타임슬롯)
6. Booking 생성
7. **백그라운드 태스크**: Google Calendar 이벤트 생성 및 `google_event_id` 업데이트

**Google Calendar 이벤트 생성**:
- summary: booking.topic
- description: booking.description
- start: when + time_slot.start_time (UTC)
- end: when + time_slot.end_time (UTC)
- calendarId: host.calendar.google_calendar_id

**예외**:
- `404 NOT_FOUND`: 호스트 또는 타임슬롯 없음
- `400 BAD_REQUEST`: 자기 예약, 과거 날짜, 요일 불일치
- `409 CONFLICT`: 중복 예약

#### 12. GET /bookings
내 예약 목록 (게스트)

**Headers**: `Authorization: Bearer {token}`
**Query Parameters**:
- `page` (required, >= 1)
- `page_size` (required, 1-50)

**Response**: `200 OK`
```json
{
  "bookings": [
    {
      "id": 1,
      "when": "2025-01-15",
      "topic": "프로젝트 상담",
      "description": "...",
      "time_slot": { ... },
      "host": { ... },
      "attendance_status": "SCHEDULED",
      "google_event_id": "abc123",
      "files": [],
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "total_count": 10
}
```

#### 13. GET /calendar/{host_username}/bookings
호스트 예약 조회

**Path Parameter**: `host_username`
**Query Parameters**: `year`, `month`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "when": "2025-01-15",
    "time_slot": { ... }
  }
]
```

**추가**: Google Calendar 이벤트도 함께 반환
```json
[
  // Booking 목록
  ...,
  // Google Calendar Event 목록
  {
    "id": "google_event_id",
    "when": "2025-01-15",
    "time_slot": { ... }
  }
]
```

#### 14. GET /calendar/{host_username}/bookings/stream
호스트 예약 스트리밍 조회 (SSE)

**Response**: `text/event-stream`

각 줄마다 JSON 객체 전송:
```
{"id": 1, "when": "2025-01-15", ...}
{"id": 2, "when": "2025-01-16", ...}
{"id": "google_event_123", ...}
```

**Spring Boot 마이그레이션**: SSE 또는 WebSocket으로 구현

#### 15. PATCH /bookings/{booking_id}
예약 수정 (호스트)

**Headers**: `Authorization: Bearer {token}`
**Path Parameter**: `booking_id`

**Request Body**:
```json
{
  "when": "2025-01-20",      // optional
  "time_slot_id": 2          // optional
}
```

**Response**: `200 OK`

**비즈니스 로직**:
1. 예약 존재 확인
2. 현재 사용자가 호스트인지 확인
3. 변경사항 적용
4. Google Calendar 이벤트 업데이트

#### 16. PATCH /guest-bookings/{booking_id}
예약 수정 (게스트)

**Request Body**:
```json
{
  "topic": "새 주제",        // optional
  "description": "새 설명",  // optional
  "when": "2025-01-20",      // optional
  "time_slot_id": 2          // optional
}
```

**비즈니스 로직**: 호스트 수정과 유사하나 게스트만 가능

#### 17. PATCH /bookings/{booking_id}/status
참석 상태 변경 (호스트)

**Request Body**:
```json
{
  "attendance_status": "COMPLETED"
}
```

**Response**: `200 OK`

#### 18. DELETE /guest-bookings/{booking_id}
예약 취소 (게스트)

**Response**: `204 NO_CONTENT`

**비즈니스 로직**:
1. 예약 존재 확인
2. 현재 사용자가 게스트인지 확인
3. Google Calendar 이벤트 삭제
4. Booking 삭제

#### 19. POST /bookings/{booking_id}/upload
파일 업로드

**Headers**: `Authorization: Bearer {token}`
**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: File (multiple files 가능)

**Response**: `200 OK`

**비즈니스 로직**:
1. 예약 존재 확인
2. 파일 저장 (`uploads/bookings/`)
3. BookingFile 엔티티 생성

## 🔐 인증/인가

### JWT 토큰 구조

**생성**: `appserver/apps/account/endpoints.py` - `login()`

**페이로드**:
```json
{
  "sub": "username",
  "display_name": "표시 이름",
  "is_host": false,
  "exp": 1735891200
}
```

**검증**: `appserver/apps/account/deps.py` - `get_current_user()`

**프로세스**:
1. Authorization 헤더에서 토큰 추출
2. JWT 디코드 및 서명 검증
3. 만료 시간 확인 ⚠️ **버그 있음 (수정 필요)**
4. username으로 User 조회
5. User 객체 반환

**⚠️ 토큰 만료 검증 버그**:
```python
# 현재 (잘못됨) - deps.py:26
if now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES) < expires_at:
    raise ExpiredTokenError()

# 수정 필요
if now > expires_at:
    raise ExpiredTokenError()
```

### 권한 관리

**호스트 전용 API**:
- POST /calendar
- PATCH /calendar
- POST /time-slots
- PATCH /bookings/{id}
- PATCH /bookings/{id}/status

**게스트 전용 API**:
- POST /bookings/{host_username}
- PATCH /guest-bookings/{id}
- DELETE /guest-bookings/{id}

**검증 위치**: 각 엔드포인트 함수 내부에서 `user.is_host` 확인

### Spring Boot 마이그레이션 시 권장사항

```java
// Spring Security + JWT
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/account/signup", "/account/login").permitAll()
                .requestMatchers("/calendar", "/time-slots").hasRole("HOST")
                .requestMatchers("/bookings/**").authenticated()
            )
            .oauth2ResourceServer(OAuth2ResourceServerConfigurer::jwt)
            .build();
    }
}
```

## 📅 Google Calendar 연동

**파일**: `appserver/libs/google/calendar/services.py`

### GoogleCalendarService 클래스

**초기화**:
```python
def __init__(
    self,
    default_google_calendar_id: str,
    credentials_path: Optional[Path] = GOOGLE_SERVICE_ACCOUNT_CREDENTIAL_PATH
):
    # Service Account credentials JSON 파일 로드
    # Calendar API v3 서비스 객체 생성
```

**주요 메서드**:

#### create_event()
```python
async def create_event(
    summary: str,
    start_datetime: datetime,
    end_datetime: datetime,
    google_calendar_id: Optional[str] = None,
    conference: Optional[dict] = None,
    location: Optional[str] = None,
    description: Optional[str] = None,
    reminder: Optional[Reminder] = None,
    timezone: Optional[str] = "Asia/Seoul"
) -> CalendarEvent | None
```

**반환**: Google Calendar Event 객체 (event["id"] 포함) 또는 None

#### event_list()
```python
async def event_list(
    time_min: datetime,
    time_max: datetime,
    google_calendar_id: Optional[str] = None
) -> list[CalendarEvent]
```

#### update_event()
```python
async def update_event(
    event_id: str,
    start_datetime: datetime,
    end_datetime: datetime,
    ...
) -> bool
```

#### delete_event()
```python
async def delete_event(
    event_id: str,
    google_calendar_id: Optional[str] = None
) -> bool
```

### Spring Boot 마이그레이션

```java
// Google Calendar API Client Library for Java 사용
@Service
public class GoogleCalendarService {

    private final Calendar calendarService;

    public GoogleCalendarService() throws IOException {
        GoogleCredentials credentials = GoogleCredentials
            .fromStream(new FileInputStream("credentials.json"))
            .createScoped(Collections.singleton(CalendarScopes.CALENDAR));

        this.calendarService = new Calendar.Builder(
            GoogleNetHttpTransport.newTrustedTransport(),
            GsonFactory.getDefaultInstance(),
            new HttpCredentialsAdapter(credentials)
        ).build();
    }

    public Event createEvent(EventRequest request) throws IOException {
        Event event = new Event()
            .setSummary(request.getSummary())
            .setDescription(request.getDescription())
            .setStart(new EventDateTime()
                .setDateTime(new DateTime(request.getStartDateTime())))
            .setEnd(new EventDateTime()
                .setDateTime(new DateTime(request.getEndDateTime())));

        return calendarService.events()
            .insert(request.getCalendarId(), event)
            .setConferenceDataVersion(1)
            .execute();
    }

    // 기타 메서드들...
}
```

## 🔄 Spring Boot 마이그레이션 매핑

### 1. 프로젝트 구조

```
FastAPI → Spring Boot
─────────────────────────────────────
appserver/                          → src/main/java/com/example/cohechat/
├── apps/account/                   → domain/account/
│   ├── models.py                   → entity/User.java
│   ├── schemas.py                  → dto/*Dto.java
│   ├── endpoints.py                → controller/AccountController.java
│   ├── deps.py                     → (Service Layer 통합)
│   └── exceptions.py               → exception/*Exception.java
│
├── apps/calendar/                  → domain/calendar/
│   ├── models.py                   → entity/{Calendar,TimeSlot,Booking}.java
│   ├── schemas.py                  → dto/*Dto.java
│   ├── endpoints.py                → controller/CalendarController.java
│   ├── enums.py                    → enums/AttendanceStatus.java
│   └── exceptions.py               → exception/*Exception.java
│
├── libs/                           → util/
│   └── google/calendar/            → service/GoogleCalendarService.java
│
├── app.py                          → Application.java (@SpringBootApplication)
└── db.py                           → application.yml (datasource 설정)
```

### 2. 엔티티 매핑

**FastAPI (SQLModel)**:
```python
class User(SQLModel, table=True):
    __tablename__ = "users"
    id: int = Field(default=None, primary_key=True)
    username: str = Field(max_length=50, unique=True)
    # ...
```

**Spring Boot (JPA)**:
```java
@Entity
@Table(name = "users")
@Getter @Setter
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50, unique = true, nullable = false)
    private String username;

    // ...
}
```

### 3. Repository 레이어

**FastAPI**:
```python
# endpoints.py에서 직접 SQLAlchemy 사용
stmt = select(User).where(User.username == username)
result = await session.execute(stmt)
user = result.scalar_one_or_none()
```

**Spring Boot**:
```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
}
```

### 4. Service 레이어 (신규 추가 권장)

```java
@Service
@Transactional
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserDto signup(SignupRequest request) {
        // 1. 중복 확인
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateUsernameException();
        }

        // 2. 비밀번호 해싱
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 3. User 생성
        User user = User.builder()
            .username(request.getUsername())
            .hashedPassword(hashedPassword)
            // ...
            .build();

        User saved = userRepository.save(user);

        // 4. 호스트면 캘린더 생성
        if (saved.getIsHost()) {
            calendarService.createCalendar(saved);
        }

        return UserDto.from(saved);
    }
}
```

### 5. Controller 레이어

```java
@RestController
@RequestMapping("/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @PostMapping("/signup")
    public ResponseEntity<UserDto> signup(@Valid @RequestBody SignupRequest request) {
        UserDto user = accountService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        TokenResponse token = accountService.login(request);
        return ResponseEntity.ok(token);
    }

    @GetMapping("/@me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(UserDto.from(user));
    }
}
```

### 6. 예외 처리

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(DuplicateUsernameException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateUsername(DuplicateUsernameException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse("username already exists"));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse(e.getMessage()));
    }
}
```

### 7. 비동기 처리 (백그라운드 태스크)

**FastAPI**:
```python
background_tasks.add_task(_apply_event_id)
```

**Spring Boot**:
```java
@Service
public class BookingService {

    @Async
    public CompletableFuture<Void> createGoogleCalendarEvent(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow();

        Event event = googleCalendarService.createEvent(...);

        booking.setGoogleEventId(event.getId());
        bookingRepository.save(booking);

        return CompletableFuture.completedFuture(null);
    }
}

// @EnableAsync 설정 필요
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.initialize();
        return executor;
    }
}
```

### 8. 의존성 (pom.xml/build.gradle)

```xml
<!-- Spring Boot Starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- JPA & Database -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.xerial</groupId>
    <artifactId>sqlite-jdbc</artifactId>
</dependency>

<!-- Security & JWT -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>

<!-- Google Calendar API -->
<dependency>
    <groupId>com.google.apis</groupId>
    <artifactId>google-api-services-calendar</artifactId>
    <version>v3-rev20220715-2.0.0</version>
</dependency>

<!-- Validation -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

## 📝 마이그레이션 체크리스트

### Phase 1: 프로젝트 설정
- [ ] Spring Boot 3.x 프로젝트 생성
- [ ] 의존성 추가 (JPA, Security, Google API 등)
- [ ] application.yml 설정 (DB, JWT 등)
- [ ] 패키지 구조 설계

### Phase 2: 도메인 모델
- [ ] User 엔티티 생성
- [ ] Calendar 엔티티 생성
- [ ] TimeSlot 엔티티 생성
- [ ] Booking 엔티티 생성
- [ ] BookingFile 엔티티 생성
- [ ] Enum 클래스 생성 (AttendanceStatus)

### Phase 3: Repository
- [ ] UserRepository
- [ ] CalendarRepository
- [ ] TimeSlotRepository
- [ ] BookingRepository
- [ ] BookingFileRepository

### Phase 4: Service (신규 레이어)
- [ ] AccountService (회원가입, 로그인 등)
- [ ] CalendarService
- [ ] TimeSlotService
- [ ] BookingService
- [ ] GoogleCalendarService

### Phase 5: Security
- [ ] JWT 토큰 생성/검증 구현
- [ ] Spring Security 설정
- [ ] 권한 검사 (호스트/게스트)

### Phase 6: Controller & DTO
- [ ] AccountController + DTOs
- [ ] CalendarController + DTOs
- [ ] TimeSlotController + DTOs
- [ ] BookingController + DTOs

### Phase 7: 예외 처리
- [ ] 커스텀 예외 클래스
- [ ] GlobalExceptionHandler

### Phase 8: 파일 업로드
- [ ] MultipartFile 처리
- [ ] 파일 저장소 구현

### Phase 9: 테스트
- [ ] 단위 테스트 (Service)
- [ ] 통합 테스트 (Controller)

### Phase 10: 배포 준비
- [ ] Docker 설정
- [ ] CI/CD 파이프라인
- [ ] 환경 변수 관리

## 🚨 주의사항

1. **토큰 검증 버그**: 반드시 수정 필요
2. **Service 레이어**: FastAPI에는 없지만 Spring Boot에서 추가 권장
3. **JSON 필드**: SQLite에서 JSON 타입 처리 방법 확인 필요
4. **비동기 처리**: @Async 적절히 활용
5. **트랜잭션**: @Transactional 적절히 사용
6. **파일 업로드**: MultipartFile 및 스토리지 전략 수립

---

**문서 작성일**: 2024-12-23
**작성자**: coheChat Team

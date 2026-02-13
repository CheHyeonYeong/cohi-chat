# 데이터베이스 분리 전략

## 1. 현재 상태 분석

### 1.1 DB 스키마 개요

현재 시스템은 단일 SQLite 데이터베이스를 사용하며, 총 7개의 주요 테이블로 구성되어 있다.

#### 테이블 목록

| 테이블명 | 설명 | PK 타입 | 저장소 |
|---------|------|---------|--------|
| member | 사용자 정보 | UUID (BINARY(16)) | SQLite |
| refresh_token | 리프레시 토큰 | username (String) | Redis |
| calendar | 캘린더 설정 | user_id (UUID) | SQLite |
| time_slot | 예약 가능 시간대 | Long (IDENTITY) | SQLite |
| time_slot_weekday | 시간대별 요일 | Long (IDENTITY) | SQLite |
| booking | 예약 정보 | Long (IDENTITY) | SQLite |
| booking_file | 예약 첨부 파일 | Long (IDENTITY) | SQLite |

### 1.2 상세 스키마 정의

#### Member 테이블
```sql
CREATE TABLE member (
    id BINARY(16) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,  -- GUEST, HOST, ADMIN
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_member_email ON member(email);
CREATE INDEX idx_member_username ON member(username);
```

#### Calendar 테이블
```sql
CREATE TABLE calendar (
    user_id BINARY(16) PRIMARY KEY,  -- Member.id 참조 (1:1)
    topics TEXT NOT NULL,             -- JSON 배열
    description TEXT NOT NULL,
    google_calendar_id VARCHAR(1024) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### TimeSlot 테이블
```sql
CREATE TABLE time_slot (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    calendar_id BINARY(16) NOT NULL,  -- Calendar.user_id 참조
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### TimeSlotWeekday 테이블
```sql
CREATE TABLE time_slot_weekday (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    time_slot_id BIGINT NOT NULL,  -- TimeSlot.id FK
    weekday INTEGER NOT NULL,       -- 0(일) ~ 6(토)
    CONSTRAINT uk_time_slot_weekday UNIQUE (time_slot_id, weekday)
);

CREATE INDEX idx_time_slot_weekday ON time_slot_weekday(time_slot_id, weekday);
```

#### Booking 테이블
```sql
CREATE TABLE booking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    time_slot_id BIGINT NOT NULL,       -- TimeSlot.id FK
    guest_id BINARY(16) NOT NULL,       -- Member.id 참조
    booking_date DATE NOT NULL,
    topic VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    attendance_status VARCHAR(20) NOT NULL,
    google_event_id VARCHAR(64),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### BookingFile 테이블
```sql
CREATE TABLE booking_file (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,          -- Booking.id FK
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP
);
```

### 1.3 테이블 간 의존성 분석

```
                    ┌─────────────────┐
                    │     member      │
                    │  (id: UUID)     │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 │
    ┌─────────────┐   ┌─────────────┐          │
    │   calendar  │   │   booking   │          │
    │ (user_id)   │   │ (guest_id)  │◄─────────┘
    └──────┬──────┘   └──────┬──────┘
           │                 │
           ▼                 ▼
    ┌─────────────┐   ┌─────────────┐
    │  time_slot  │──►│   booking   │
    │ (calendar_id)   │ (time_slot_id)
    └──────┬──────┘   └──────┬──────┘
           │                 │
           ▼                 ▼
┌──────────────────┐  ┌──────────────┐
│time_slot_weekday │  │ booking_file │
│  (time_slot_id)  │  │ (booking_id) │
└──────────────────┘  └──────────────┘
```

#### 의존성 요약

| 소스 테이블 | 참조 테이블 | 관계 | FK 컬럼 |
|------------|------------|------|---------|
| calendar | member | 1:1 | user_id |
| time_slot | calendar | N:1 | calendar_id |
| time_slot_weekday | time_slot | N:1 | time_slot_id |
| booking | time_slot | N:1 | time_slot_id |
| booking | member | N:1 | guest_id (논리적) |
| booking_file | booking | N:1 | booking_id |

### 1.4 트랜잭션 경계 분석

#### MemberService 트랜잭션
| 메서드 | 트랜잭션 | 관련 테이블 | 설명 |
|--------|---------|------------|------|
| signup | @Transactional | member | 회원 가입 |
| login | @Transactional | member, refresh_token(Redis) | 로그인 및 토큰 발급 |
| updateMember | @Transactional | member | 회원 정보 수정 |
| deleteMember | @Transactional | member | 소프트 삭제 |
| refreshAccessToken | @Transactional(readOnly) | member, refresh_token(Redis) | 토큰 갱신 |

#### CalendarService 트랜잭션
| 메서드 | 트랜잭션 | 관련 테이블 | 설명 |
|--------|---------|------------|------|
| createCalendar | @Transactional | calendar, member(조회) | 캘린더 생성 |
| getCalendar | @Transactional(readOnly) | calendar | 캘린더 조회 |
| updateCalendar | @Transactional | calendar | 캘린더 수정 |
| getCalendarBySlugPublic | @Transactional(readOnly) | member, calendar | 공개 캘린더 조회 |
| getBookingsBySlug | @Transactional(readOnly) | member, calendar, booking | 슬러그별 예약 조회 |

#### TimeSlotService 트랜잭션
| 메서드 | 트랜잭션 | 관련 테이블 | 설명 |
|--------|---------|------------|------|
| createTimeSlot | @Transactional | time_slot, time_slot_weekday, calendar(조회) | 시간대 생성 |
| getTimeSlotsByHost | @Transactional(readOnly) | time_slot, calendar | 호스트 시간대 조회 |
| getTimeSlotsByHostId | @Transactional(readOnly) | time_slot, member, calendar | ID로 시간대 조회 |

#### BookingService 트랜잭션
| 메서드 | 트랜잭션 | 관련 테이블 | 설명 |
|--------|---------|------------|------|
| createBooking | @Transactional | booking, time_slot(조회), calendar(조회) | 예약 생성 + Google Calendar |
| updateBookingSchedule | @Transactional | booking, time_slot(조회), calendar(조회) | 일정 변경 |
| updateBookingStatus | @Transactional | booking, time_slot(조회) | 상태 변경 |
| cancelBooking | @Transactional | booking, time_slot(조회), calendar(조회) | 예약 취소 |
| updateBooking | @Transactional | booking, time_slot(조회), calendar(조회) | 예약 수정 |

#### BookingFileService 트랜잭션
| 메서드 | 트랜잭션 | 관련 테이블 | 설명 |
|--------|---------|------------|------|
| uploadFile | @Transactional | booking_file, booking(조회), time_slot(조회) | 파일 업로드 |
| getFiles | @Transactional(readOnly) | booking_file, booking(조회), time_slot(조회) | 파일 목록 |
| deleteFile | @Transactional | booking_file, booking(조회), time_slot(조회) | 파일 삭제 |
| downloadFile | @Transactional(readOnly) | booking_file, booking(조회), time_slot(조회) | 파일 다운로드 |

### 1.5 도메인 간 조인 쿼리 분석

#### 현재 조인 쿼리 패턴

1. **Booking -> TimeSlot 조인** (FETCH JOIN)
```java
@Query("SELECT b FROM Booking b LEFT JOIN FETCH b.timeSlot WHERE b.guestId = :guestId")
@Query("SELECT b FROM Booking b JOIN FETCH b.timeSlot t WHERE t.userId = :hostId")
```

2. **TimeSlot -> TimeSlotWeekday 조인** (CascadeType.ALL)
   - OneToMany 관계로 자동 조인

3. **도메인 간 서비스 호출 패턴**
   - CalendarService -> MemberService.findMember()
   - CalendarService -> BookingService.getBookingsByHostAndDate()
   - TimeSlotService -> MemberRepository.findByIdAndRoleAndIsDeletedFalse()
   - BookingService -> CalendarRepository.findById()

---

## 2. Phase 1: 읽기/쓰기 분리 설계

### 2.1 목표

- 읽기 트래픽을 Read Replica로 분산
- 쓰기 성능에 영향 없이 읽기 성능 향상
- 기존 코드 변경 최소화

### 2.2 아키텍처 설계

```
                    ┌─────────────────┐
                    │   Application   │
                    │   (Spring Boot) │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │  DataSource     │
                    │  Router         │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │    Primary    │ │   Replica 1   │ │   Replica 2   │
    │   (Write)     │ │   (Read)      │ │   (Read)      │
    └───────────────┘ └───────────────┘ └───────────────┘
```

### 2.3 구현 방안

#### 2.3.1 AbstractRoutingDataSource 활용

```java
public class RoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        return TransactionSynchronizationManager.isCurrentTransactionReadOnly()
            ? DataSourceType.READ
            : DataSourceType.WRITE;
    }
}
```

#### 2.3.2 트랜잭션 분류

| 트랜잭션 타입 | 라우팅 대상 | 해당 메서드 |
|-------------|-----------|------------|
| @Transactional | Primary (Write) | signup, login, createCalendar, createBooking 등 |
| @Transactional(readOnly = true) | Replica (Read) | getCalendar, getBookings, getTimeSlots 등 |

#### 2.3.3 설정 예시

```yaml
spring:
  datasource:
    primary:
      url: jdbc:postgresql://primary-db:5432/cohichat
      username: ${DB_USERNAME}
      password: ${DB_PASSWORD}
    replica:
      url: jdbc:postgresql://replica-db:5432/cohichat
      username: ${DB_USERNAME_READONLY}
      password: ${DB_PASSWORD}
```

### 2.4 주의사항

1. **Replication Lag**
   - 쓰기 직후 읽기 시 데이터 불일치 가능성
   - 해결: 쓰기 후 동일 트랜잭션 내 조회 또는 강제 Primary 라우팅

2. **트랜잭션 전파**
   - readOnly 트랜잭션에서 쓰기 메서드 호출 시 오류 발생
   - 해결: 명시적 트랜잭션 분리 필요

---

## 3. Phase 2: 도메인별 DB 분리 계획

### 3.1 도메인 분류

| 도메인 | 테이블 | 특성 | 분리 우선순위 |
|--------|-------|------|-------------|
| Member | member, refresh_token | 인증/인가 핵심, 조회 빈번 | 2순위 |
| Calendar | calendar | 호스트 설정, 변경 적음 | 3순위 |
| TimeSlot | time_slot, time_slot_weekday | 캘린더와 밀접, 조회 빈번 | 3순위 (Calendar와 함께) |
| Booking | booking | 핵심 비즈니스, 트랜잭션 빈번 | 1순위 |
| File | booking_file | 독립적, I/O 집약적 | 1순위 |

### 3.2 분리 후 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│ Member Service│       │Booking Service│       │ File Service  │
│               │       │               │       │               │
│  ┌─────────┐  │       │  ┌─────────┐  │       │  ┌─────────┐  │
│  │Member DB│  │       │  │BookingDB│  │       │  │ File DB │  │
│  │ (MySQL) │  │       │  │(Postgres)│  │       │  │ (Mongo) │  │
│  └─────────┘  │       │  └─────────┘  │       │  └─────────┘  │
└───────────────┘       └───────────────┘       └───────────────┘
        │                       │
        │               ┌───────────────┐
        └───────────────│Calendar/Slot │
                        │   Service    │
                        │  ┌─────────┐  │
                        │  │CalendarDB│  │
                        │  │ (MySQL)  │  │
                        │  └─────────┘  │
                        └───────────────┘
```

### 3.3 도메인 간 통신 변경

#### 현재: 직접 Repository 호출
```java
// BookingService.java
private void createGoogleCalendarEvent(Booking booking, TimeSlot timeSlot) {
    calendarRepository.findById(hostId).ifPresent(calendar -> {
        // ...
    });
}
```

#### 변경 후: 도메인 서비스 API 호출
```java
// BookingService.java
private void createGoogleCalendarEvent(Booking booking, TimeSlot timeSlot) {
    calendarServiceClient.getCalendar(hostId).ifPresent(calendar -> {
        // ...
    });
}
```

### 3.4 변경 필요 쿼리 목록

| 현재 쿼리 | 관련 도메인 | 변경 방안 |
|----------|-----------|----------|
| Booking JOIN TimeSlot | Booking + TimeSlot | TimeSlot ID로 별도 조회 후 조합 |
| TimeSlot에서 userId(Member) 검증 | TimeSlot + Member | Member Service API 호출 |
| Calendar에서 Member 조회 | Calendar + Member | Member Service API 호출 |

### 3.5 각 도메인별 상세 분리 계획

#### 3.5.1 File 도메인 분리 (1단계)
- **대상**: booking_file 테이블
- **새 DB**: MongoDB (문서 지향, 파일 메타데이터에 적합)
- **변경 영향**:
  - BookingFileService -> BookingFileRepository 인터페이스 유지
  - MongoDB용 Repository 구현체로 교체
  - booking_id는 참조만 유지 (FK 제거)

#### 3.5.2 Booking 도메인 분리 (2단계)
- **대상**: booking 테이블
- **새 DB**: PostgreSQL (복잡한 쿼리 지원)
- **변경 영향**:
  - time_slot_id: 논리적 참조로 변경
  - guest_id: 논리적 참조 유지
  - TimeSlot 정보는 Booking 생성 시 스냅샷으로 저장 고려

#### 3.5.3 Member 도메인 분리 (3단계)
- **대상**: member 테이블
- **새 DB**: MySQL (성숙한 인증 관련 기능)
- **변경 영향**:
  - 다른 모든 서비스에서 Member Service API 호출로 변경
  - JWT 토큰에 필요 정보 포함으로 조회 최소화

#### 3.5.4 Calendar/TimeSlot 도메인 분리 (4단계)
- **대상**: calendar, time_slot, time_slot_weekday 테이블
- **새 DB**: MySQL (Calendar와 함께 유지)
- **변경 영향**:
  - Member 조회 -> Member Service API
  - Booking에서 TimeSlot 조회 -> Calendar Service API

---

## 4. 데이터 마이그레이션 계획

### 4.1 마이그레이션 전략

#### Blue-Green 배포 방식

```
단계 1: 새 DB 프로비저닝
        [Old DB] ─────────────► [New DB] (비어있음)

단계 2: 데이터 동기화 시작
        [Old DB] ══════════════► [New DB]
                  (CDC/복제)

단계 3: 듀얼 라이트 (양쪽 기록)
        [App] ──┬──► [Old DB]
                └──► [New DB]

단계 4: 읽기 전환
        [App] ──────► [New DB] (읽기)
               └────► [Old DB] (쓰기)

단계 5: 쓰기 전환
        [App] ──────► [New DB] (읽기/쓰기)
                      [Old DB] (백업)

단계 6: 정리
        [App] ──────► [New DB]
                      [Old DB 폐기]
```

### 4.2 도메인별 마이그레이션 순서

| 순서 | 도메인 | 예상 소요 시간 | 다운타임 |
|-----|-------|--------------|---------|
| 1 | File | 2주 | 0 (무중단) |
| 2 | Booking | 3주 | 10분 (최종 전환) |
| 3 | Member | 3주 | 30분 (인증 관련) |
| 4 | Calendar/TimeSlot | 2주 | 10분 |

### 4.3 데이터 정합성 검증

```java
@Scheduled(cron = "0 0 * * * *")  // 매시간
public void validateDataConsistency() {
    // 1. 레코드 수 비교
    long oldCount = oldRepository.count();
    long newCount = newRepository.count();

    // 2. 샘플 데이터 해시 비교
    List<String> oldHashes = oldRepository.getSampleHashes(100);
    List<String> newHashes = newRepository.getSampleHashes(100);

    // 3. 불일치 시 알림
    if (!oldHashes.equals(newHashes)) {
        alertService.sendDataInconsistencyAlert();
    }
}
```

---

## 5. 리스크 및 롤백 계획

### 5.1 주요 리스크

| 리스크 | 영향도 | 발생 확률 | 완화 방안 |
|-------|-------|---------|----------|
| 데이터 불일치 | 높음 | 중간 | CDC 모니터링, 정합성 검증 자동화 |
| 트랜잭션 분산 실패 | 높음 | 낮음 | Saga 패턴 적용, 보상 트랜잭션 |
| 성능 저하 | 중간 | 중간 | 캐싱 전략, API 최적화 |
| 서비스 간 장애 전파 | 높음 | 중간 | Circuit Breaker, 폴백 처리 |
| 네트워크 지연 | 중간 | 높음 | 비동기 처리, 이벤트 기반 통신 |

### 5.2 롤백 시나리오

#### 시나리오 1: 마이그레이션 중 데이터 손상
```
1. 듀얼 라이트 중단
2. 새 DB로의 트래픽 차단
3. Old DB 백업에서 복구
4. 원인 분석 후 재시도
```

#### 시나리오 2: 분리된 서비스 장애
```
1. Circuit Breaker 활성화
2. 폴백 로직 실행 (캐시된 데이터 사용)
3. 장애 서비스 복구
4. 정상 트래픽 재개
```

#### 시나리오 3: 성능 심각 저하
```
1. Feature Flag로 새 아키텍처 비활성화
2. 레거시 경로로 트래픽 전환
3. 성능 문제 분석 및 최적화
4. 점진적 재전환
```

### 5.3 롤백 체크리스트

- [ ] 각 단계별 롤백 스크립트 준비
- [ ] Old DB 백업 정책 확인 (최소 30일 보관)
- [ ] Feature Flag 설정 확인
- [ ] 모니터링 알림 설정
- [ ] 롤백 의사결정 기준 정의 (에러율 > 5%, 지연 > 2초)

---

## 6. 구현 로드맵

### 6.1 Phase 1: 읽기/쓰기 분리 (4주)

| 주차 | 작업 내용 |
|-----|----------|
| 1주 | DataSource 라우팅 구현, 설정 파일 작성 |
| 2주 | 기존 트랜잭션 readOnly 속성 정리 |
| 3주 | Replica DB 프로비저닝, 복제 설정 |
| 4주 | 테스트 및 성능 검증, 프로덕션 배포 |

### 6.2 Phase 2: 도메인별 분리 (16주)

| 주차 | 도메인 | 작업 내용 |
|-----|-------|----------|
| 1-2주 | File | MongoDB 설정, Repository 구현 |
| 3-4주 | File | 마이그레이션, 테스트, 배포 |
| 5-7주 | Booking | PostgreSQL 설정, Service 분리 |
| 8-9주 | Booking | 마이그레이션, Saga 패턴 적용 |
| 10-12주 | Member | MySQL 설정, 인증 서비스 분리 |
| 13-14주 | Member | 마이그레이션, 토큰 검증 최적화 |
| 15-16주 | Calendar/TimeSlot | 분리 및 마이그레이션 |

---

## 7. 결론

### 7.1 권장 접근 방식

1. **Phase 1 우선 적용**: 읽기/쓰기 분리는 비교적 안전하고 즉각적인 성능 향상 가능
2. **Phase 2 점진적 진행**: 각 도메인 분리 후 충분한 안정화 기간 필요
3. **모니터링 강화**: 각 단계별 성능 메트릭 수집 및 알림 체계 구축

### 7.2 예상 효과

- 읽기 처리량 2-3배 향상 (Phase 1)
- 도메인별 독립적 확장 가능 (Phase 2)
- 장애 격리로 시스템 안정성 향상
- 도메인별 최적 DB 선택으로 성능 최적화

### 7.3 필요 리소스

- 인프라: 추가 DB 인스턴스 3-4개
- 인력: 백엔드 개발자 2명, DevOps 1명 (파트타임)
- 기간: 총 20주 (Phase 1: 4주, Phase 2: 16주)

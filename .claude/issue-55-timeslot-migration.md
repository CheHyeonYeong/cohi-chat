# Issue #55: TimeSlot 생성 API (Python to Java Migration)

## 개요
호스트가 자신의 가용 시간대를 설정할 수 있는 TimeSlot 생성 API를 개발합니다.
Python 백엔드(`backend-python/appserver/apps/calendar/`)를 Java(`backend/`)로 마이그레이션합니다.

**중요**: TDD(Test-Driven Development)로 진행합니다. 테스트를 먼저 작성한 후 구현합니다.

---

## Commit 규칙

**CRITICAL**: 모든 commit message에 아래 footer를 절대로 추가하지 마세요:
- `Co-Authored-By: Claude ...` - 금지
- Claude가 작성했다는 어떤 표시도 금지

Checkpoint commit은 다음 형식으로 작성:
```
feat(timeslot): [설명]

- 상세 변경 내용
```

---

## 참조 Python 코드

### 1. Model (`models.py:63-104`)
```python
class TimeSlot(SQLModel, table=True):
    __tablename__ = "time_slots"

    id: int = Field(default=None, primary_key=True)
    start_time: time
    end_time: time
    weekdays: list[int] = Field(
        sa_type=JSON,
        description="예약 가능한 요일들"
    )
    calendar_id: int = Field(foreign_key="calendars.id")
    created_at: AwareDatetime
    updated_at: AwareDatetime
```

### 2. Schema (`schemas.py:53-82`)
```python
# 요일 유효성 검증 (0-6)
def validate_weekdays(weekdays: list[int]) -> list[int]:
    weekday_range = range(7)
    for weekday in weekdays:
        if weekday not in weekday_range:
            raise ValueError(f"요일 값은 0부터 6까지의 값이어야 합니다.")
    return weekdays

class TimeSlotCreateIn(SQLModel):
    start_time: time
    end_time: time
    weekdays: Weekdays

    @model_validator(mode="after")
    def validate_time_slot(self):
        if self.start_time >= self.end_time:
            raise ValueError("시작 시간은 종료 시간보다 빨라야 합니다.")
        return self

class TimeSlotOut(SQLModel):
    id: int
    start_time: time
    end_time: time
    weekdays: list[int]
    created_at: AwareDatetime
    updated_at: AwareDatetime
```

### 3. Endpoint (`endpoints.py:259-315`)
- `POST /time-slots` - 타임슬롯 생성
- 호스트 권한 검증
- 시간대 중복 검증 (같은 요일에 겹치는 시간대가 있으면 422 에러)

---

## 작업 단계 (TDD)

### Phase 1: Entity 및 Repository

#### Step 1.1: TimeSlot Entity 테스트 작성
**파일**: `backend/src/test/java/com/coDevs/cohiChat/timeslot/TimeSlotTest.java`

테스트 케이스:
- [ ] TimeSlot 엔티티 생성 테스트
- [ ] weekdays JSON 변환 테스트

#### Step 1.2: TimeSlot Entity 구현
**파일**: `backend/src/main/java/com/coDevs/cohiChat/timeslot/entity/TimeSlot.java`

필드:
- `id`: Long (PK, auto-generated)
- `calendarId`: UUID (FK to calendar)
- `startTime`: LocalTime
- `endTime`: LocalTime
- `weekdays`: List<Integer> (JSON 타입, 0=월요일 ~ 6=일요일)
- `createdAt`: LocalDateTime
- `updatedAt`: LocalDateTime

**Checkpoint Commit**: `feat(timeslot): TimeSlot 엔티티 추가`

---

#### Step 1.3: TimeSlot Repository 테스트 작성
**파일**: `backend/src/test/java/com/coDevs/cohiChat/timeslot/TimeSlotRepositoryTest.java`

테스트 케이스:
- [ ] 타임슬롯 저장 테스트
- [ ] calendarId로 타임슬롯 목록 조회 테스트
- [ ] 겹치는 시간대 조회 쿼리 테스트

#### Step 1.4: TimeSlot Repository 구현
**파일**: `backend/src/main/java/com/coDevs/cohiChat/timeslot/TimeSlotRepository.java`

메서드:
- `List<TimeSlot> findByCalendarId(UUID calendarId)`
- `List<TimeSlot> findOverlappingTimeSlots(UUID calendarId, LocalTime startTime, LocalTime endTime)`

**Checkpoint Commit**: `feat(timeslot): TimeSlot Repository 추가`

---

### Phase 2: DTO 클래스

#### Step 2.1: Request/Response DTO 구현
**파일들**:
- `backend/src/main/java/com/coDevs/cohiChat/timeslot/request/TimeSlotCreateRequestDTO.java`
- `backend/src/main/java/com/coDevs/cohiChat/timeslot/response/TimeSlotResponseDTO.java`

**TimeSlotCreateRequestDTO 유효성 검증**:
- `startTime`: NotNull
- `endTime`: NotNull
- `weekdays`: NotEmpty, 각 값은 0-6 범위
- 커스텀 검증: startTime < endTime

**Checkpoint Commit**: `feat(timeslot): TimeSlot DTO 클래스 추가`

---

### Phase 3: Service 계층

#### Step 3.1: TimeSlot Service 테스트 작성
**파일**: `backend/src/test/java/com/coDevs/cohiChat/timeslot/TimeSlotServiceTest.java`

테스트 케이스:
- [ ] 성공: 호스트가 유효한 타임슬롯을 생성할 수 있다
- [ ] 실패: 게스트는 타임슬롯을 생성할 수 없다 (403)
- [ ] 실패: 캘린더가 없으면 타임슬롯을 생성할 수 없다 (404)
- [ ] 실패: 겹치는 시간대가 있으면 타임슬롯을 생성할 수 없다 (409)
- [ ] 실패: startTime >= endTime이면 생성 불가 (400)
- [ ] 실패: weekdays 값이 0-6 범위를 벗어나면 생성 불가 (400)

#### Step 3.2: TimeSlot Service 구현
**파일**: `backend/src/main/java/com/coDevs/cohiChat/timeslot/TimeSlotService.java`

메서드:
- `TimeSlotResponseDTO createTimeSlot(Member member, TimeSlotCreateRequestDTO request)`

로직:
1. 호스트 권한 검증
2. 캘린더 존재 여부 확인
3. 시간대 중복 검증 (같은 요일에 겹치는 시간대)
4. TimeSlot 엔티티 생성 및 저장
5. Response DTO 반환

**Checkpoint Commit**: `feat(timeslot): TimeSlot Service 추가`

---

### Phase 4: Controller 계층

#### Step 4.1: TimeSlot Controller 테스트 작성
**파일**: `backend/src/test/java/com/coDevs/cohiChat/timeslot/TimeSlotControllerTest.java`

테스트 케이스 (Python 테스트 참조: `test_timeslot_api.py`):
- [ ] 성공: 호스트가 유효한 타임슬롯 정보를 제출하면 201 Created
- [ ] 실패: startTime >= endTime이면 422 Unprocessable Entity
- [ ] 실패: weekdays에 잘못된 값(-1 또는 7 이상)이 있으면 422
- [ ] 실패: 겹치는 시간대가 있으면 409 Conflict
- [ ] 실패: 게스트가 생성 시도하면 403 Forbidden
- [ ] 실패: 캘린더가 없으면 404 Not Found

#### Step 4.2: TimeSlot Controller 구현
**파일**: `backend/src/main/java/com/coDevs/cohiChat/timeslot/TimeSlotController.java`

엔드포인트:
```java
@PostMapping("/timeslot/v1")
public ResponseEntity<TimeSlotResponseDTO> createTimeSlot(
    @AuthenticationPrincipal UserDetails userDetails,
    @Valid @RequestBody TimeSlotCreateRequestDTO request
)
```

**Checkpoint Commit**: `feat(timeslot): TimeSlot Controller 추가`

---

### Phase 5: 통합 테스트 및 마무리

#### Step 5.1: 통합 테스트 작성
**파일**: `backend/src/test/java/com/coDevs/cohiChat/timeslot/TimeSlotIntegrationTest.java`

전체 흐름 테스트:
- [ ] 호스트 로그인 → 캘린더 생성 → 타임슬롯 생성 → 조회 확인

#### Step 5.2: Calendar-TimeSlot 관계 설정
Calendar 엔티티에 TimeSlot 관계 추가 (필요시)

**Final Checkpoint Commit**: `feat(timeslot): TimeSlot 생성 API 구현 완료`

---

## 파일 구조 (생성 예정)

```
backend/src/main/java/com/coDevs/cohiChat/timeslot/
├── entity/
│   └── TimeSlot.java
├── request/
│   └── TimeSlotCreateRequestDTO.java
├── response/
│   └── TimeSlotResponseDTO.java
├── TimeSlotRepository.java
├── TimeSlotService.java
└── TimeSlotController.java

backend/src/test/java/com/coDevs/cohiChat/timeslot/
├── TimeSlotTest.java
├── TimeSlotRepositoryTest.java
├── TimeSlotServiceTest.java
├── TimeSlotControllerTest.java
└── TimeSlotIntegrationTest.java
```

---

## 에러 코드 (이미 정의됨: `ErrorCode.java`)

| 코드 | HTTP 상태 | 메시지 |
|------|----------|--------|
| TIMESLOT_NOT_FOUND | 404 | 시간대가 없습니다. |
| TIMESLOT_OVERLAP | 409 | 겹치는 시간대가 이미 존재합니다. |
| CALENDAR_NOT_FOUND | 404 | 캘린더가 없습니다. |
| GUEST_ACCESS_DENIED | 403 | 게스트 권한으로는 이용할 수 없는 기능입니다. |

---

## 시간대 중복 검증 로직

Python 코드 참조 (`endpoints.py:276-305`):

```
기존 타임슬롯: 10:00-11:00, weekdays=[0,1,2] (월,화,수)
새 타임슬롯: 10:30-11:30, weekdays=[0] (월)

겹침 조건:
1. 시간이 겹침: existing.start_time < new.end_time AND existing.end_time > new.start_time
2. 요일이 겹침: 교집합이 존재

위 예시는 겹치므로 409 Conflict 응답
```

---

## 진행 체크리스트

- [ ] Phase 1: Entity 및 Repository
  - [ ] Step 1.1: TimeSlot Entity 테스트
  - [ ] Step 1.2: TimeSlot Entity 구현
  - [ ] Step 1.3: TimeSlot Repository 테스트
  - [ ] Step 1.4: TimeSlot Repository 구현
- [ ] Phase 2: DTO 클래스
  - [ ] Step 2.1: Request/Response DTO
- [ ] Phase 3: Service 계층
  - [ ] Step 3.1: Service 테스트
  - [ ] Step 3.2: Service 구현
- [ ] Phase 4: Controller 계층
  - [ ] Step 4.1: Controller 테스트
  - [ ] Step 4.2: Controller 구현
- [ ] Phase 5: 통합 테스트
  - [ ] Step 5.1: 통합 테스트
  - [ ] Step 5.2: 관계 설정 및 마무리

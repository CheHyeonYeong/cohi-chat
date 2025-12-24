# 테스트 가이드 문서

> 백엔드/프론트엔드 테스트 전략 및 가이드

## 📋 목차
- [테스트 전략](#테스트-전략)
- [백엔드 테스트](#백엔드-테스트)
- [프론트엔드 테스트](#프론트엔드-테스트)
- [E2E 테스트](#e2e-테스트)
- [테스트 커버리지](#테스트-커버리지)

## 🎯 테스트 전략

### 테스트 피라미드

```
        ╱╲
       ╱  ╲  E2E Tests (소수)
      ╱────╲  - 주요 사용자 플로우
     ╱      ╲ - 실제 환경과 유사
    ╱────────╲
   ╱          ╲ Integration Tests (중간)
  ╱────────────╲ - API 엔드포인트
 ╱              ╲ - DB 연동
╱────────────────╲
        Unit Tests (다수)
  - 순수 함수
  - 비즈니스 로직
```

### 테스트 범위

| 계층 | 백엔드 | 프론트엔드 |
|------|--------|-----------|
| **Unit** | 유틸리티 함수, 모델 메서드 | Hooks, 유틸리티 함수 |
| **Integration** | API 엔드포인트 + DB | 컴포넌트 + API Mock |
| **E2E** | - | 전체 사용자 플로우 |

## 🧪 백엔드 테스트

### 기술 스택
- **pytest** - 테스트 프레임워크
- **pytest-asyncio** - 비동기 테스트 지원
- **httpx** - FastAPI 테스트 클라이언트
- **SQLAlchemy** - 테스트 DB 관리

### 프로젝트 구조

```
tests/
├── conftest.py              # Fixture 정의
├── test_account.py          # 계정 관리 테스트
├── test_calendar.py         # 캘린더 테스트
├── test_booking.py          # 예약 테스트
├── test_google_calendar.py  # Google Calendar 통합 테스트
└── utils/
    └── factories.py         # 테스트 데이터 팩토리
```

### Fixture 설정

**conftest.py**:
```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from httpx import AsyncClient

from appserver.app import app
from appserver.db import Base

# 테스트 DB 엔진
@pytest.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()

# 테스트 세션
@pytest.fixture
async def test_session(test_engine):
    async_session = sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()

# 테스트 클라이언트
@pytest.fixture
async def client(test_session):
    app.dependency_overrides[get_session] = lambda: test_session
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

# 인증 헤더
@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(test_user.username)
    return {"Authorization": f"Bearer {token}"}
```

### 단위 테스트 (Unit Tests)

#### 유틸리티 함수 테스트
```python
# tests/test_utils.py
from appserver.libs.datetime.calendar import get_calendar_days

def test_get_calendar_days():
    # Given
    date = datetime(2024, 12, 1)

    # When
    days = get_calendar_days(date)

    # Then
    assert len(days) == 42  # 6주
    assert days[0].month == 11  # 이전 달
    assert days[-1].month == 1  # 다음 달
```

#### 모델 검증 테스트
```python
# tests/test_models.py
import pytest
from appserver.apps.calendar.models import TimeSlot

def test_timeslot_validation():
    # Given
    timeslot = TimeSlot(
        start_time=time(14, 0),
        end_time=time(13, 0),  # 잘못된 시간
        weekdays=[0, 1, 2]
    )

    # When & Then
    with pytest.raises(ValueError, match="start_time must be before end_time"):
        timeslot.validate()
```

### 통합 테스트 (Integration Tests)

#### 회원가입 API 테스트
```python
# tests/test_account.py
import pytest

@pytest.mark.asyncio
async def test_signup_success(client):
    # Given
    payload = {
        "username": "testuser",
        "display_name": "Test User",
        "email": "test@example.com",
        "password": "password123",
        "is_host": False
    }

    # When
    response = await client.post("/account/signup", json=payload)

    # Then
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "hashed_password" not in data  # 비밀번호 노출 방지

@pytest.mark.asyncio
async def test_signup_duplicate_username(client, test_user):
    # Given
    payload = {
        "username": test_user.username,  # 이미 존재
        "display_name": "Another User",
        "email": "another@example.com",
        "password": "password123",
    }

    # When
    response = await client.post("/account/signup", json=payload)

    # Then
    assert response.status_code == 409
    assert "username already exists" in response.json()["detail"]
```

#### 로그인 API 테스트
```python
@pytest.mark.asyncio
async def test_login_success(client, test_user):
    # Given
    payload = {
        "username": test_user.username,
        "password": "password123"  # 테스트 유저 비밀번호
    }

    # When
    response = await client.post("/account/login", json=payload)

    # Then
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_wrong_password(client, test_user):
    # Given
    payload = {
        "username": test_user.username,
        "password": "wrongpassword"
    }

    # When
    response = await client.post("/account/login", json=payload)

    # Then
    assert response.status_code == 401
```

#### 캘린더 생성 테스트
```python
# tests/test_calendar.py
@pytest.mark.asyncio
async def test_create_calendar_as_host(client, test_host, auth_headers):
    # Given
    payload = {
        "topics": ["프로젝트 상담", "기술 멘토링"],
        "description": "상담 가능한 주제입니다.",
        "google_calendar_id": "test@gmail.com"
    }

    # When
    response = await client.post(
        "/calendar",
        json=payload,
        headers=auth_headers
    )

    # Then
    assert response.status_code == 201
    data = response.json()
    assert len(data["topics"]) == 2
    assert data["google_calendar_id"] == "test@gmail.com"

@pytest.mark.asyncio
async def test_create_calendar_as_guest(client, test_user, auth_headers):
    # Given
    payload = {
        "topics": ["상담"],
        "description": "설명",
        "google_calendar_id": "test@gmail.com"
    }

    # When
    response = await client.post(
        "/calendar",
        json=payload,
        headers=auth_headers
    )

    # Then
    assert response.status_code == 403  # 호스트만 가능
```

#### 예약 생성 테스트
```python
# tests/test_booking.py
@pytest.mark.asyncio
async def test_create_booking_success(
    client,
    test_user,
    test_host,
    test_timeslot,
    auth_headers
):
    # Given
    payload = {
        "when": "2025-01-15",  # 월요일
        "topic": "프로젝트 상담",
        "description": "프로젝트 관련 상담 요청",
        "time_slot_id": test_timeslot.id
    }

    # When
    response = await client.post(
        f"/bookings/{test_host.username}",
        json=payload,
        headers=auth_headers
    )

    # Then
    assert response.status_code == 201
    data = response.json()
    assert data["when"] == "2025-01-15"
    assert data["topic"] == "프로젝트 상담"
    assert data["guest"]["id"] == test_user.id

@pytest.mark.asyncio
async def test_create_booking_past_date(client, test_host, test_timeslot, auth_headers):
    # Given
    payload = {
        "when": "2020-01-01",  # 과거
        "topic": "상담",
        "description": "설명",
        "time_slot_id": test_timeslot.id
    }

    # When
    response = await client.post(
        f"/bookings/{test_host.username}",
        json=payload,
        headers=auth_headers
    )

    # Then
    assert response.status_code == 400
    assert "past date" in response.json()["detail"]

@pytest.mark.asyncio
async def test_create_booking_duplicate(
    client,
    test_user,
    test_host,
    test_timeslot,
    test_booking,
    auth_headers
):
    # Given: 이미 예약된 날짜/시간
    payload = {
        "when": test_booking.when.isoformat(),
        "topic": "상담",
        "description": "설명",
        "time_slot_id": test_booking.time_slot_id
    }

    # When
    response = await client.post(
        f"/bookings/{test_host.username}",
        json=payload,
        headers=auth_headers
    )

    # Then
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]
```

### 테스트 데이터 팩토리

**tests/utils/factories.py**:
```python
from datetime import datetime, time
from appserver.apps.account.models import User
from appserver.apps.calendar.models import Calendar, TimeSlot, Booking

class UserFactory:
    @staticmethod
    async def create(
        session,
        username="testuser",
        is_host=False,
        **kwargs
    ):
        user = User(
            username=username,
            display_name=kwargs.get("display_name", "Test User"),
            email=kwargs.get("email", f"{username}@example.com"),
            hashed_password="$argon2id$...",  # 해싱된 비밀번호
            is_host=is_host
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

class CalendarFactory:
    @staticmethod
    async def create(session, host, **kwargs):
        calendar = Calendar(
            topics=kwargs.get("topics", ["상담"]),
            description=kwargs.get("description", "설명"),
            google_calendar_id=kwargs.get("google_calendar_id", "test@gmail.com"),
            host_id=host.id
        )
        session.add(calendar)
        await session.commit()
        await session.refresh(calendar)
        return calendar

class TimeSlotFactory:
    @staticmethod
    async def create(session, calendar, **kwargs):
        timeslot = TimeSlot(
            start_time=kwargs.get("start_time", time(14, 0)),
            end_time=kwargs.get("end_time", time(15, 0)),
            weekdays=kwargs.get("weekdays", [0, 1, 2, 3, 4]),
            calendar_id=calendar.id
        )
        session.add(timeslot)
        await session.commit()
        await session.refresh(timeslot)
        return timeslot
```

### Mock 사용 (Google Calendar API)

```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
@patch('appserver.libs.google.calendar.services.GoogleCalendarService.create_event')
async def test_booking_creates_google_event(
    mock_create_event,
    client,
    test_host,
    test_timeslot,
    auth_headers
):
    # Given
    mock_create_event.return_value = {
        "id": "google_event_123",
        "htmlLink": "https://calendar.google.com/..."
    }

    payload = {
        "when": "2025-01-15",
        "topic": "상담",
        "description": "설명",
        "time_slot_id": test_timeslot.id
    }

    # When
    response = await client.post(
        f"/bookings/{test_host.username}",
        json=payload,
        headers=auth_headers
    )

    # Then
    assert response.status_code == 201

    # Google Calendar API 호출 확인
    await asyncio.sleep(0.1)  # 백그라운드 태스크 완료 대기
    mock_create_event.assert_called_once()
    call_args = mock_create_event.call_args
    assert call_args.kwargs["summary"] == "상담"
```

### 테스트 실행

```bash
# 전체 테스트
pytest

# 특정 파일
pytest tests/test_account.py

# 특정 테스트
pytest tests/test_account.py::test_signup_success

# 커버리지 측정
pytest --cov=appserver --cov-report=html

# 병렬 실행 (빠름)
pytest -n auto
```

## 🎨 프론트엔드 테스트

### 기술 스택
- **Vitest** - 테스트 프레임워크 (Vite 기반)
- **React Testing Library** - 컴포넌트 테스트
- **MSW (Mock Service Worker)** - API 모킹
- **@testing-library/user-event** - 사용자 인터랙션 시뮬레이션

### 프로젝트 구조

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── components/
│   │   │   ├── Button.test.tsx
│   │   │   └── Calendar/
│   │   │       ├── Body.test.tsx
│   │   │       └── Navigator.test.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.test.ts
│   │   │   └── useBookings.test.ts
│   │   └── utils/
│   │       └── utils.test.ts
│   └── test/
│       ├── setup.ts           # 테스트 설정
│       └── mocks/
│           └── handlers.ts    # MSW 핸들러
└── vitest.config.ts
```

### Vitest 설정

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

**src/test/setup.ts**:
```typescript
import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

// MSW 서버 설정
export const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 유틸리티 함수 테스트

```typescript
// src/__tests__/utils/utils.test.ts
import { describe, it, expect } from 'vitest';
import { getCalendarDays, camelToSnake, snakeToCamel } from '~/libs/utils';

describe('getCalendarDays', () => {
  it('should return 42 days (6 weeks)', () => {
    const date = new Date(2024, 11, 1);  // 2024-12-01
    const days = getCalendarDays(date);

    expect(days).toHaveLength(42);
  });

  it('should include previous month days', () => {
    const date = new Date(2024, 11, 1);  // 2024-12-01 (일요일)
    const days = getCalendarDays(date);

    // 첫 날은 이전 달
    expect(days[0].isCurrentMonth).toBe(false);
  });
});

describe('camelToSnake', () => {
  it('should convert camelCase to snake_case', () => {
    const input = { userId: 1, displayName: 'John' };
    const output = camelToSnake(input);

    expect(output).toEqual({ user_id: 1, display_name: 'John' });
  });
});
```

### Hook 테스트

```typescript
// src/__tests__/hooks/useAuth.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '~/hooks/useAuth';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'mock_token');
  });

  it('should fetch user data successfully', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    });
  });

  it('should handle auth error', async () => {
    localStorage.removeItem('auth_token');

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

### 컴포넌트 테스트

```typescript
// src/__tests__/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '~/components/button';

describe('Button', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should call onClick handler', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);

    expect(screen.getByRole('button')).toHaveClass('bg-blue-500');

    rerender(<Button variant="secondary">Secondary</Button>);

    expect(screen.getByRole('button')).toHaveClass('bg-gray-500');
  });
});
```

### MSW Mock 핸들러

**src/test/mocks/handlers.ts**:
```typescript
import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:8000';

export const handlers = [
  // 로그인
  http.post(`${API_URL}/account/login`, async ({ request }) => {
    const body = await request.json();

    if (body.username === 'testuser' && body.password === 'password') {
      return HttpResponse.json({
        access_token: 'mock_token',
        token_type: 'bearer',
      });
    }

    return HttpResponse.json(
      { detail: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // 현재 사용자 조회
  http.get(`${API_URL}/account/@me`, () => {
    return HttpResponse.json({
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      is_host: false,
    });
  }),

  // 캘린더 조회
  http.get(`${API_URL}/calendar/:username`, ({ params }) => {
    return HttpResponse.json({
      topics: ['프로젝트 상담', '기술 멘토링'],
      description: '상담 가능합니다',
    });
  }),

  // 예약 생성
  http.post(`${API_URL}/bookings/:username`, async ({ request, params }) => {
    const body = await request.json();

    return HttpResponse.json(
      {
        id: 1,
        when: body.when,
        topic: body.topic,
        description: body.description,
        time_slot: { id: body.time_slot_id },
      },
      { status: 201 }
    );
  }),
];
```

### 통합 테스트 예시

```typescript
// src/__tests__/components/Calendar/BookingForm.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from '~/components/calendar/BookingForm';

describe('BookingForm', () => {
  it('should create booking successfully', async () => {
    const calendar = {
      topics: ['프로젝트 상담', '기술 멘토링'],
      description: '상담',
    };

    const onCreated = vi.fn();

    render(
      <BookingForm
        calendar={calendar}
        slug="testhost"
        timeSlotId={1}
        when={new Date('2025-01-15')}
        onBack={vi.fn()}
        onCreated={onCreated}
      />
    );

    // 주제 선택
    await userEvent.selectOptions(
      screen.getByLabelText('주제:'),
      '프로젝트 상담'
    );

    // 설명 입력
    await userEvent.type(
      screen.getByLabelText('설명:'),
      '프로젝트 관련 상담 요청'
    );

    // 제출
    await userEvent.click(screen.getByText('예약 신청하기'));

    // 성공 확인
    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled();
    });
  });
});
```

### 테스트 실행

```bash
# 전체 테스트
pnpm test

# Watch 모드
pnpm test --watch

# UI 모드
pnpm test --ui

# 커버리지
pnpm test --coverage
```

## 🔄 E2E 테스트

### Playwright 설정

```bash
pnpm add -D @playwright/test
```

**playwright.config.ts**:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'pnpm dev',
    port: 3000,
  },
});
```

### E2E 테스트 예시

```typescript
// e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete booking flow', async ({ page }) => {
  // 1. 로그인
  await page.goto('/app/login');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/app');

  // 2. 호스트 캘린더로 이동
  await page.goto('/app/calendar/testhost?year=2025&month=1');

  // 3. 날짜 선택
  await page.click('text=15');

  // 4. 타임슬롯 선택
  await page.click('text=14:00 - 15:00');

  // 5. 예약 폼 작성
  await page.selectOption('select[id="topic"]', '프로젝트 상담');
  await page.fill('textarea[id="description"]', '프로젝트 관련 상담 요청');

  // 6. 예약 제출
  await page.click('button:has-text("예약 신청하기")');

  // 7. 성공 확인
  await expect(page).toHaveURL(/\/app\/calendar\/testhost/);
  await expect(page.locator('text=예약 생성 완료')).toBeVisible();
});
```

## 📊 테스트 커버리지

### 목표 커버리지
- **백엔드**: 80% 이상
- **프론트엔드**: 70% 이상

### 우선순위
1. **Critical Path (높음)**:
   - 인증/인가
   - 예약 생성/수정/삭제
   - 결제 (향후)

2. **Core Features (중간)**:
   - 캘린더 관리
   - 타임슬롯 관리
   - 파일 업로드

3. **Nice to Have (낮음)**:
   - 유틸리티 함수
   - UI 컴포넌트

### 커버리지 확인

```bash
# 백엔드
pytest --cov=appserver --cov-report=html
open htmlcov/index.html

# 프론트엔드
pnpm test --coverage
open coverage/index.html
```

## ✅ CI/CD 통합

### GitHub Actions 예시

**.github/workflows/test.yml**:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest --cov=appserver

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test --coverage
```

---

**문서 작성일**: 2024-12-23
**작성자**: coheChat Team

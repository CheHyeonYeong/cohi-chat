# Frontend 아키텍처 문서

> React + TypeScript + Vite 기반 프론트엔드 구조 및 컴포넌트 가이드

## 📋 목차
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [라우팅](#라우팅)
- [상태 관리](#상태-관리)
- [컴포넌트](#컴포넌트)
- [Hooks](#hooks)
- [API 통신](#api-통신)
- [스타일링](#스타일링)

## 🛠 기술 스택

### 핵심 라이브러리
- **React 18.3** - UI 라이브러리
- **TypeScript 5.6** - 타입 안전성
- **Vite 6.0** - 빌드 도구 (빠른 HMR)

### 상태 관리
- **TanStack Query v5** - 서버 상태 관리
  - 캐싱, 리페칭, 낙관적 업데이트
  - queryKey 기반 캐시 관리

### 라우팅
- **TanStack Router v1** - 타입 안전 라우팅
  - 파일 기반 라우팅
  - 타입 안전한 path params, search params

### 스타일링
- **Tailwind CSS 3.4** - 유틸리티 CSS
- **Less** - CSS 전처리기 (calendar.less)

### 기타
- **clsx** - 클래스명 조건부 결합
- **pnpm** - 패키지 매니저

## 📁 프로젝트 구조

```
frontend/
├── public/                  # 정적 파일
├── src/
│   ├── components/         # 재사용 컴포넌트
│   │   ├── button/        # Button 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── calendar/      # 캘린더 관련 컴포넌트
│   │   │   ├── Body.tsx           # 캘린더 그리드
│   │   │   ├── Navigator.tsx     # 월 네비게이션
│   │   │   ├── Timeslots.tsx     # 타임슬롯 목록
│   │   │   ├── BookingForm.tsx   # 예약 폼
│   │   │   └── index.ts
│   │   └── Pagination.tsx # 페이지네이션
│   │
│   ├── hooks/              # Custom Hooks
│   │   ├── useAuth.ts              # 인증 상태
│   │   ├── useBookings.ts          # 예약 목록/생성
│   │   ├── useCalendarEvent.ts     # 캘린더 이벤트
│   │   ├── useCalendarNavigation.ts # 캘린더 네비게이션
│   │   ├── useCalendarDateSelection.ts # 날짜 선택
│   │   ├── useCreateBooking.ts     # 예약 생성 mutation
│   │   ├── useHost.ts              # 호스트 정보
│   │   ├── useLogin.ts             # 로그인 mutation
│   │   ├── useSignup.ts            # 회원가입 mutation
│   │   └── useTimeslots.ts         # 타임슬롯 조회
│   │
│   ├── libs/               # 유틸리티 함수
│   │   ├── bookings.ts     # 예약 API 함수
│   │   ├── httpClient.ts   # HTTP 클라이언트
│   │   └── utils.ts        # 유틸리티 (캘린더, 변환 등)
│   │
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── account/
│   │   │   ├── Login.tsx   # 로그인 페이지
│   │   │   └── Signup.tsx  # 회원가입 페이지
│   │   ├── calendar/
│   │   │   ├── Calendar.tsx    # 캘린더 메인
│   │   │   ├── Booking.tsx     # 예약 상세
│   │   │   └── MyBookings.tsx  # 내 예약 목록
│   │   └── main/
│   │       └── Home.tsx     # 홈 페이지
│   │
│   ├── routes/             # TanStack Router 라우트 정의
│   │   ├── __root.tsx      # 루트 라우트
│   │   ├── index.tsx       # / (홈)
│   │   └── app/            # /app (인증 필요)
│   │       ├── index.tsx           # /app
│   │       ├── login.tsx           # /app/login
│   │       ├── signup.tsx          # /app/signup
│   │       ├── my-bookings.tsx     # /app/my-bookings
│   │       └── calendar/
│   │           └── $slug.tsx       # /app/calendar/:slug
│   │
│   ├── types/              # TypeScript 타입 정의
│   │   ├── booking.ts      # 예약 관련 타입
│   │   ├── event.ts        # 이벤트 관련 타입
│   │   └── timeslot.ts     # 타임슬롯 타입
│   │
│   ├── main.tsx            # 엔트리 포인트
│   ├── index.css           # 글로벌 CSS
│   └── vite-env.d.ts       # Vite 타입 선언
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🗺 라우팅

### TanStack Router 구조

```typescript
// routes/__root.tsx - 루트 레이아웃
export const Route = createRootRoute({
  component: RootComponent,
});

// routes/app/calendar/$slug.tsx - 동적 경로
export const Route = createFileRoute('/app/calendar/$slug')({
  component: Calendar,
  validateSearch: (search) => ({
    year: Number(search.year),
    month: Number(search.month),
  }),
});
```

### 라우트 맵

| Path | Component | 설명 | 인증 필요 |
|------|-----------|------|----------|
| `/` | Home | 홈 페이지 | ❌ |
| `/app` | App | 앱 메인 | ✅ |
| `/app/login` | Login | 로그인 | ❌ |
| `/app/signup` | Signup | 회원가입 | ❌ |
| `/app/calendar/:slug` | Calendar | 캘린더 (호스트별) | ✅ |
| `/app/my-bookings` | MyBookings | 내 예약 목록 | ✅ |

### 네비게이션 예시

```typescript
import { useNavigate } from '@tanstack/react-router';

const navigate = useNavigate();

// 기본 네비게이션
navigate({ to: '/app' });

// 동적 파라미터 + Search Params
navigate({
  to: '/app/calendar/$slug',
  params: { slug: 'johndoe' },
  search: { year: 2025, month: 1 }
});
// → /app/calendar/johndoe?year=2025&month=1
```

## 📊 상태 관리

### TanStack Query 패턴

#### Query (데이터 조회)
```typescript
// useAuth.ts
export function useAuth() {
  return useQuery<User>({
    queryKey: ['auth'],
    queryFn: async () => {
      const data = await httpClient<User>(`${API_URL}/account/@me`);
      return data;
    },
    retry: false,
  });
}

// 사용
const auth = useAuth();
if (auth.isLoading) return <div>Loading...</div>;
if (auth.isError) return <div>Error</div>;
return <div>{auth.data.username}</div>;
```

#### Mutation (데이터 변경)
```typescript
// useCreateBooking.ts
export function useCreateBooking(slug: string, year: number, month: number) {
  return useMutation<IBookingDetail, Error, IBookingPayload>({
    mutationFn: async (bookingData) => {
      return await httpClient(`${API_URL}/bookings/${slug}`, {
        method: 'POST',
        body: bookingData,
      });
    },
    onSuccess: () => {
      // 성공 시 캘린더 페이지로 리다이렉트
      navigate({ to: '/app/calendar/$slug', params: { slug } });
    },
  });
}

// 사용
const createBooking = useCreateBooking('johndoe', 2025, 1);

const handleSubmit = () => {
  createBooking.mutate({
    when: '2025-01-15',
    topic: '프로젝트 상담',
    description: '...',
    timeSlotId: 1,
  });
};
```

### Query Keys 전략

| Query Key | 설명 | 캐시 |
|-----------|------|------|
| `['auth']` | 현재 사용자 정보 | 영구 |
| `['calendar', slug]` | 호스트 캘린더 | 5분 |
| `['timeslots', slug, date]` | 타임슬롯 목록 | prefetch 사용 |
| `['bookings', date]` | 예약 목록 | 실시간 refetch |
| `['my-bookings', page, pageSize]` | 내 예약 | 페이지별 캐시 |

## 🎨 컴포넌트

### Button
**파일**: `components/button/Button.tsx`

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}
```

**사용 예시**:
```typescript
<Button variant="primary" onClick={handleClick}>
  클릭
</Button>
```

### Calendar 컴포넌트 구조

#### Body (캘린더 그리드)
**파일**: `components/calendar/Body.tsx`

**Props**:
```typescript
interface BodyProps {
  year: number;
  month: number;
  days: CalendarDay[];  // 달력 일자 배열
  baseDate?: Date;
  timeslots: ITimeSlot[];
  bookings: (IBooking | ICalendarEvent)[];
  onSelectDay: (date: Date) => void;
}
```

**기능**:
- 7x6 그리드로 달력 렌더링
- 이전/다음 달 날짜는 비활성화 (회색)
- 예약 있는 날짜 표시 (파란 점)
- 클릭 시 날짜 선택

**구현 핵심**:
```typescript
const weeks = days.reduce((acc, day, idx) => {
  const weekIdx = Math.floor(idx / 7);
  if (!acc[weekIdx]) acc[weekIdx] = [];
  acc[weekIdx].push(day);
  return acc;
}, [] as CalendarDay[][]);

// 각 주별로 렌더링
{weeks.map((week, weekIdx) => (
  <div key={weekIdx} className="grid grid-cols-7">
    {week.map((day) => (
      <DayCell key={day.date} day={day} />
    ))}
  </div>
))}
```

#### Navigator (월 네비게이션)
**파일**: `components/calendar/Navigator.tsx`

**Props**:
```typescript
interface NavigatorProps {
  slug: string;
  year: number;
  month: number;
  baseDate?: Date;
  onPrevious: () => void;
  onNext: () => void;
}
```

**기능**:
- 현재 연/월 표시
- 이전/다음 월 버튼
- baseDate 이전 월은 비활성화

#### Timeslots (타임슬롯 목록)
**파일**: `components/calendar/Timeslots.tsx`

**Props**:
```typescript
interface TimeslotsProps {
  timeslots: ITimeSlot[];
  bookings: (IBooking | ICalendarEvent)[];
  baseDate: Date | null;
  onSelectTimeslot: (timeslot: ITimeSlot) => void;
}
```

**기능**:
- 선택된 날짜의 타임슬롯 표시
- 이미 예약된 타임슬롯은 비활성화
- 클릭 시 예약 폼으로 이동

**예약 여부 확인 로직**:
```typescript
const isBooked = bookings.some(
  (booking) =>
    booking.when === baseDate &&
    booking.timeSlot.id === timeslot.id
);
```

#### BookingForm (예약 폼)
**파일**: `components/calendar/BookingForm.tsx`

**Props**:
```typescript
interface BookingFormProps {
  calendar: ICalendar;
  slug: string;
  timeSlotId: number;
  when: Date;
  onBack: () => void;
  onCreated: () => void;
}
```

**기능**:
- 주제 선택 (calendar.topics에서)
- 설명 입력
- 예약 생성 mutation 실행

**구현**:
```typescript
const createBookingMutation = useCreateBooking(slug, when.getFullYear(), when.getMonth() + 1);

const handleSubmit = (event: React.FormEvent) => {
  event.preventDefault();
  createBookingMutation.mutate({
    timeSlotId,
    topic: topicRef.current?.value ?? '',
    description: descriptionRef.current?.value ?? '',
    when: formatDate(when),
  });
};
```

### Pagination
**파일**: `components/Pagination.tsx`

**Props**:
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

## 🪝 Hooks

### useAuth
**파일**: `hooks/useAuth.ts`

**반환**: `UseQueryResult<User>`

**사용**:
```typescript
const auth = useAuth();

if (auth.isError) {
  navigate({ to: '/app/login' });
}

return <div>환영합니다, {auth.data.username}님</div>;
```

### useBookings
**파일**: `hooks/useBookings.ts`

**함수**: `useBookings(hostname, date)`

**반환**: `UseQueryResult<IBooking[]>`

**사용**:
```typescript
const { data: bookings = [], refetch } = useBookings('johndoe', new Date());
```

### useBookingsStreamQuery
**파일**: `hooks/useBookings.ts`

**함수**: `useBookingsStreamQuery({ endpoint, onMessage })`

**기능**: SSE 스트리밍으로 실시간 예약 목록 조회

**구현**:
```typescript
export function useBookingsStreamQuery({ endpoint, onMessage }) {
  const [items, setItems] = useState<Array<IBooking | ICalendarEvent>>([]);

  useEffect(() => {
    const fetchStream = async () => {
      const response = await fetch(endpoint);
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);
        lines.forEach(line => {
          const data = JSON.parse(line);
          setItems(prev => {
            // 중복 제거
            if (prev.some(item => item.id === data.id)) return prev;
            return [...prev, data];
          });
          onMessage?.(data);
        });
      }
    };

    fetchStream();
  }, [endpoint]);

  return items;
}
```

**⚠️ 주의**: `onMessage`는 의존성 배열에서 제외하여 무한 루프 방지

### useCalendarDateSelection
**파일**: `hooks/useCalendarDateSelection.ts`

**함수**: `useCalendarDateSelection()`

**반환**: `{ handleSelectDay }`

**기능**: 날짜 선택 시 타임슬롯 prefetch

**구현**:
```typescript
export function useCalendarDateSelection() {
  const queryClient = useQueryClient();

  const handleSelectDay = useCallback(async (slug: string, date: Date) => {
    await queryClient.prefetchQuery({
      queryKey: ['timeslots', slug, date.toISOString()],
      queryFn: async () => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        return await httpClient(`${API_URL}/time-slots/${slug}?year=${year}&month=${month}`);
      },
    });
  }, [queryClient]);

  return { handleSelectDay };
}
```

### useCalendarNavigation
**파일**: `hooks/useCalendarNavigation.ts`

**기능**: 월 네비게이션 (이전/다음 월)

**구현**:
```typescript
export function useCalendarNavigation() {
  const navigate = useNavigate();
  const { slug } = useParams({ from: '/app/calendar/$slug' });
  const { year, month } = useSearch({ from: '/app/calendar/$slug' });

  const handlePrevious = useCallback(() => {
    const prev = new Date(year, month - 2);
    navigate({
      to: '/app/calendar/$slug',
      params: { slug },
      search: { year: prev.getFullYear(), month: prev.getMonth() + 1 },
    });
  }, [year, month, slug, navigate]);

  const handleNext = useCallback(() => {
    const next = new Date(year, month);
    navigate({
      to: '/app/calendar/$slug',
      params: { slug },
      search: { year: next.getFullYear(), month: next.getMonth() + 1 },
    });
  }, [year, month, slug, navigate]);

  return { handlePrevious, handleNext };
}
```

### useCreateBooking
**파일**: `hooks/useCreateBooking.ts`

**Mutation Hook**:
```typescript
export function useCreateBooking(slug: string, year: number, month: number) {
  return useMutation<IBookingDetail, Error, IBookingPayload>({
    mutationFn: async (bookingData) => {
      return await httpClient(`${API_URL}/bookings/${slug}`, {
        method: 'POST',
        body: bookingData,
      });
    },
    onSuccess: () => {
      navigate({
        to: '/app/calendar/$slug',
        params: { slug },
        search: { year, month },
      });
    },
  });
}
```

## 🌐 API 통신

### httpClient
**파일**: `libs/httpClient.ts`

**기능**:
- JWT 토큰 자동 포함 (localStorage에서 읽기)
- Request body snake_case 변환
- Response body camelCase 변환
- 에러 처리

**구현**:
```typescript
export async function httpClient<T>(url: string, options: RequestInit = {}): Promise<T> {
  // 1. JWT 토큰 추가
  const authToken = localStorage.getItem('auth_token');
  if (authToken) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${authToken}`,
    };
  }

  // 2. Body를 snake_case로 변환
  if (options.body && !(options.body instanceof FormData)) {
    options.body = JSON.stringify(camelToSnake(options.body));
    options.headers = {
      ...options.headers,
      'Content-Type': 'application/json',
    };
  }

  // 3. Fetch 요청
  const response = await fetch(url, options);

  // 4. 에러 처리
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail);
  }

  // 5. Response를 camelCase로 변환
  const data = await response.json();
  return snakeToCamel(data) as T;
}
```

### 인증 흐름

**로그인**:
```typescript
// 1. 로그인 API 호출
const { access_token } = await httpClient('/account/login', {
  method: 'POST',
  body: { username, password },
});

// 2. 토큰 저장
localStorage.setItem('auth_token', access_token);

// 3. 홈으로 리다이렉트
navigate({ to: '/app' });
```

**로그아웃**:
```typescript
// 1. 토큰 삭제
localStorage.removeItem('auth_token');

// 2. 페이지 새로고침 또는 로그인 페이지로 이동
location.reload();
```

**인증 확인**:
```typescript
// useAuth hook에서 자동으로 처리
const auth = useAuth();

useEffect(() => {
  if (auth.isError) {
    navigate({ to: '/app/login' });
  }
}, [auth.isError]);
```

## 🎨 스타일링

### Tailwind CSS

**설정**: `tailwind.config.js`

**주요 클래스 사용**:
```typescript
// 그리드 레이아웃
<div className="grid grid-cols-7 gap-2">

// Flexbox
<div className="flex flex-col items-center justify-center">

// 반응형
<div className="w-full md:w-1/2 lg:w-1/3">

// 색상
<div className="bg-blue-500 text-white hover:bg-blue-700">

// 간격
<div className="p-4 m-2 space-y-4">
```

### Less (캘린더 전용)
**파일**: `pages/calendar/calendar.less`

**용도**: 복잡한 캘린더 그리드 스타일링

```less
.calendar {
  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  &__day {
    &--disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    &--selected {
      background-color: #3b82f6;
      color: white;
    }
  }
}
```

## 🔧 유틸리티 함수

### getCalendarDays
**파일**: `libs/utils.ts`

**함수**: `getCalendarDays(date: Date): CalendarDay[]`

**기능**: 달력 렌더링을 위한 6주(42일) 배열 생성

**반환 타입**:
```typescript
interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
}
```

**구현**:
```typescript
export function getCalendarDays(date: Date): CalendarDay[] {
  const year = date.getFullYear();
  const month = date.getMonth();

  // 해당 월의 첫 날
  const firstDay = new Date(year, month, 1);
  // 첫 주 월요일 계산
  const startDate = new Date(firstDay);
  startDate.setDate(1 - (firstDay.getDay() || 7) + 1);

  // 42일 생성 (6주)
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + i);
    days.push({
      date: current,
      day: current.getDate(),
      isCurrentMonth: current.getMonth() === month,
    });
  }

  return days;
}
```

### camelToSnake / snakeToCamel
**파일**: `libs/utils.ts`

**기능**: API 통신 시 케이스 변환

```typescript
// camelCase → snake_case (Request)
camelToSnake({ userId: 1, displayName: 'John' })
// → { user_id: 1, display_name: 'John' }

// snake_case → camelCase (Response)
snakeToCamel({ user_id: 1, display_name: 'John' })
// → { userId: 1, displayName: 'John' }
```

## 📝 타입 정의

### IBooking
**파일**: `types/booking.ts`

```typescript
export interface IBooking {
  id: number;
  when: string;  // ISO date string
  timeSlot: ITimeSlot;
}

export interface IBookingDetail extends IBooking {
  topic: string;
  description: string;
  host: IUser;
  attendanceStatus: AttendanceStatus;
  googleEventId: string | null;
  files: IBookingFile[];
  createdAt: string;
  updatedAt: string;
}

export interface IBookingPayload {
  when: string;
  topic: string;
  description: string;
  timeSlotId: number;
}
```

### ICalendar
**파일**: `types/event.ts`

```typescript
export interface ICalendar {
  topics: string[];
  description: string;
}

export interface ICalendarDetail extends ICalendar {
  hostId: number;
  googleCalendarId: string;
  createdAt: string;
  updatedAt: string;
}
```

### ITimeSlot
**파일**: `types/timeslot.ts`

```typescript
export interface ITimeSlot {
  id: number;
  startTime: string;  // HH:mm:ss
  endTime: string;
  weekdays: number[];  // 0-6
  createdAt: string;
  updatedAt: string;
}
```

## 🚀 개발 모드 실행

### 환경 변수
**.env**:
```env
VITE_API_URL=http://localhost:8000
```

### 명령어
```bash
# 개발 서버 시작
pnpm dev

# 빌드
pnpm build

# 프리뷰
pnpm preview

# 타입 체크
pnpm tsc
```

### HMR (Hot Module Replacement)
Vite의 빠른 HMR 지원:
- React 컴포넌트 수정 시 상태 유지하며 즉시 반영
- CSS 수정 시 페이지 새로고침 없이 반영

## 🐛 알려진 이슈 및 해결

### 1. 무한 루프 (useBookingsStreamQuery)
**원인**: `onMessage` 함수가 의존성 배열에 포함되어 매 렌더링마다 재실행

**해결**: 의존성 배열에서 `onMessage` 제거 (v1.1.0)

### 2. 무한 루프 (useCalendarDateSelection)
**원인**: `handleSelectDay`가 `useCallback` 없이 매번 재생성

**해결**: `useCallback`으로 메모이제이션 (v1.1.0)

### 3. CORS 에러 (개발 중)
**원인**: 백엔드에서 500 에러 발생 시 CORS 헤더 누락

**해결**: 백엔드 에러 수정 후 해결됨

## 📚 참고 자료

- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [TanStack Router 공식 문서](https://tanstack.com/router/latest)
- [React 공식 문서](https://react.dev/)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/)

---

**문서 작성일**: 2024-12-23
**작성자**: coheChat Team

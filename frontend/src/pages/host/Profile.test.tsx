import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Profile } from './Profile';

vi.mock('@tanstack/react-router', () => ({
    useParams: () => ({ hostId: 'testhost' }),
    useSearch: () => ({ selectedBookingId: undefined }),
    useNavigate: () => vi.fn(),
    Link: ({ children, to, ...props }: PropsWithChildren<Record<string, unknown>>) =>
        <a href={to as string} {...props}>{children}</a>,
    createLink:
        (component: ComponentType<Record<string, unknown>>) =>
            (props: Record<string, unknown>) => {
                const { to, ...rest } = props;
                const Component = component;
                return <Component href={to} {...rest} />;
            },
}));

vi.mock('~/components/calendar', () => ({
    Navigator: ({ year, month, slug, onPrevious, onNext }: { year: number; month: number; slug: string; onPrevious: (slug: string, date: { year: number; month: number }) => void; onNext: (slug: string, date: { year: number; month: number }) => void }) => {
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        return (
            <div data-testid="calendar-navigator">
                <span>{`${year}년 ${month}월`}</span>
                <button data-testid="prev-month-btn" onClick={() => onPrevious(slug, { year: prevYear, month: prevMonth })}>이전</button>
                <button data-testid="next-month-btn" onClick={() => onNext(slug, { year: nextYear, month: nextMonth })}>다음</button>
            </div>
        );
    },
    Body: ({ onSelectDay }: { onSelectDay: (date: Date) => void }) =>
        <div data-testid="calendar-body" onClick={() => onSelectDay(new Date(2024, 2, 15))}>calendar-body</div>,
    Timeslots: ({ onSelectTimeslot, baseDate }: { onSelectTimeslot: (ts: Record<string, unknown>) => void; baseDate: Date | null }) =>
        <div data-testid="calendar-timeslots" onClick={() => onSelectTimeslot({ id: 1, startedAt: '10:00', endedAt: '11:00' })}>{baseDate ? `timeslots-${baseDate.getDate()}` : 'timeslots'}</div>,
    BookedTimeslots: ({ onSelectBooking }: { onSelectBooking: (id: number) => void }) =>
        <div data-testid="booked-timeslots" onClick={() => onSelectBooking(1)}>booked-timeslots</div>,
    getCalendarDays: () => [],
}));

vi.mock('~/components/toast/useToast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('~/libs/errorUtils', () => ({
    getErrorMessage: (err: unknown) => err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
}));

const mockUseAuth = vi.fn();
vi.mock('~/features/member', () => ({
    useAuth: (...args: unknown[]) => mockUseAuth(...args),
    useLogout: () => ({ logout: vi.fn() }),
    useUpdateProfile: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
    useUpdateMember: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null }),
    useUploadProfileImage: () => ({ mutate: vi.fn(), isPending: false }),
    useDeleteProfileImage: () => ({ mutate: vi.fn(), isPending: false }),
}));

const mockUseBookings = vi.fn();
vi.mock('~/features/booking', () => ({
    useBookings: (...args: unknown[]) => mockUseBookings(...args),
    useBooking: () => ({ data: null, refetch: vi.fn() }),
    useUploadBookingFile: () => ({ mutateAsync: vi.fn(), isPending: false, error: null, reset: vi.fn() }),
    useDeleteBookingFile: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDownloadBookingFile: () => ({ mutate: vi.fn() }),
    BookingForm: () => <div data-testid="booking-form">BookingForm</div>,
    BookingDetailPanel: () => <div data-testid="booking-detail-panel">BookingDetailPanel</div>,
    calendarKeys: { bookingsAll: () => ['bookings'] },
}));

const mockUseHostProfile = vi.fn();
const mockUseHostCalendar = vi.fn();
const mockUseHostTimeslots = vi.fn();

vi.mock('~/features/host/hooks/useHostProfile', () => ({
    useHostProfile: (...args: unknown[]) => mockUseHostProfile(...args),
    useHostCalendar: (...args: unknown[]) => mockUseHostCalendar(...args),
    useHostTimeslots: (...args: unknown[]) => mockUseHostTimeslots(...args),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    return ({ children }: { children: ReactNode }) =>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const mockHost = {
    id: '1',
    username: 'testhost',
    displayName: 'Test Host',
    job: '프론트엔드 개발자',
    profileImageUrl: 'https://example.com/host.jpg',
    chatCount: 10,
};

const mockTimeslots = [
    {
        id: 1,
        userId: '1',
        startedAt: '10:00',
        endedAt: '11:00',
        startTime: '10:00:00',
        endTime: '11:00:00',
        weekdays: [1, 3],
        startDate: null,
        endDate: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
    },
];

beforeEach(() => {
    vi.clearAllMocks();
    mockUseBookings.mockReturnValue({ data: [] });
    mockUseHostProfile.mockReturnValue({ data: mockHost, isLoading: false, error: null });
    mockUseHostCalendar.mockReturnValue({
        data: { topics: ['개발 커리어', '이직 준비'], description: '안녕하세요, 프론트엔드 개발자입니다.' },
    });
    mockUseHostTimeslots.mockReturnValue({ data: mockTimeslots, isLoading: false });
    mockUseAuth.mockReturnValue({ data: { username: 'guestuser', displayName: 'Guest User' }, isAuthenticated: true });
});

afterEach(() => {
    cleanup();
});

describe('Profile 페이지', () => {
    it('호스트 프로필 카드를 렌더링한다', () => {
        render(<Profile />, { wrapper: createWrapper() });

        expect(screen.getByTestId('host-profile-card')).toBeInTheDocument();
        expect(screen.getByTestId('host-profile-name')).toHaveTextContent('Test Host');
    });

    it('소개 섹션을 표시한다', () => {
        render(<Profile />, { wrapper: createWrapper() });

        expect(screen.getByTestId('host-profile-description')).toBeInTheDocument();
        expect(screen.getByText('안녕하세요, 프론트엔드 개발자입니다.')).toBeInTheDocument();
    });

    it('description이 없으면 소개 섹션을 렌더링하지 않는다', () => {
        mockUseHostCalendar.mockReturnValue({ data: { topics: [], description: undefined } });

        render(<Profile />, { wrapper: createWrapper() });

        expect(screen.queryByTestId('host-profile-description')).not.toBeInTheDocument();
    });

    it('토픽 태그를 표시한다', () => {
        render(<Profile />, { wrapper: createWrapper() });

        expect(screen.getByText('개발 커리어')).toBeInTheDocument();
        expect(screen.getByText('이직 준비')).toBeInTheDocument();
    });

    it('calendar topics가 없으면 기본 토픽을 표시한다', () => {
        mockUseHostCalendar.mockReturnValue({ data: null });

        render(<Profile />, { wrapper: createWrapper() });

        expect(screen.getByText('개발 커리어')).toBeInTheDocument();
        expect(screen.getByText('코드 리뷰')).toBeInTheDocument();
    });

    it('캘린더를 표시한다', () => {
        render(<Profile />, { wrapper: createWrapper() });

        expect(screen.getByTestId('host-profile-calendar')).toBeInTheDocument();
        expect(screen.getByTestId('calendar-navigator')).toBeInTheDocument();
        expect(screen.getByTestId('calendar-body')).toBeInTheDocument();
    });

    it('로딩 중이면 로딩 메시지를 표시한다', () => {
        mockUseHostProfile.mockReturnValue({ data: undefined, isLoading: true, error: null });

        render(<Profile />, { wrapper: createWrapper() });

        expect(screen.getByTestId('host-profile-loading')).toHaveTextContent('프로필을 불러오는 중...');
    });

    it('에러 발생 시 에러 메시지와 홈 링크를 표시한다', () => {
        mockUseHostProfile.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('호스트를 찾을 수 없습니다.'),
        });

        render(<Profile />, { wrapper: createWrapper() });

        expect(screen.getByTestId('host-profile-error')).toBeInTheDocument();
        expect(screen.getByText('호스트를 찾을 수 없습니다.')).toBeInTheDocument();
        expect(screen.getByText('홈으로 돌아가기')).toBeInTheDocument();
    });

    it('날짜 클릭 시 Timeslots가 표시된다', () => {
        render(<Profile />, { wrapper: createWrapper() });

        expect(screen.queryByTestId('calendar-timeslots')).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId('calendar-body'));

        expect(screen.getByTestId('calendar-timeslots')).toBeInTheDocument();
    });

    it('시간대 선택 시 BookingForm Card가 표시된다', () => {
        mockUseHostCalendar.mockReturnValue({
            data: { topics: ['개발 커리어'], description: '테스트' },
        });

        render(<Profile />, { wrapper: createWrapper() });

        fireEvent.click(screen.getByTestId('calendar-body'));
        fireEvent.click(screen.getByTestId('calendar-timeslots'));

        expect(screen.getByTestId('host-profile-booking-form')).toBeInTheDocument();
        expect(screen.getByTestId('booking-form')).toBeInTheDocument();
    });

    it('자기 프로필일 때 Timeslots/BookingForm 대신 BookedTimeslots가 표시된다', () => {
        mockUseAuth.mockReturnValue({ data: { username: 'testhost', displayName: 'Test Host' }, isAuthenticated: true });

        render(<Profile />, { wrapper: createWrapper() });

        fireEvent.click(screen.getByTestId('calendar-body'));

        expect(screen.queryByTestId('calendar-timeslots')).not.toBeInTheDocument();
        expect(screen.queryByTestId('host-profile-booking-form')).not.toBeInTheDocument();
        expect(screen.getByTestId('booked-timeslots')).toBeInTheDocument();
    });

    it('자기 프로필일 때 제목이 "내 프로필"로 표시된다', () => {
        mockUseAuth.mockReturnValue({ data: { username: 'testhost', displayName: 'Test Host' }, isAuthenticated: true });

        render(<Profile />, { wrapper: createWrapper() });

        const headings = screen.getAllByRole('heading', { level: 1 });
        expect(headings.some(h => h.textContent?.includes('내 프로필'))).toBe(true);
    });

    it('타인 프로필일 때 제목이 "OOO님과 약속잡기"로 표시된다', () => {
        render(<Profile />, { wrapper: createWrapper() });

        const headings = screen.getAllByRole('heading', { level: 1 });
        expect(headings.some(h => h.textContent?.includes('Test Host님과 약속잡기'))).toBe(true);
    });

    it('월 이동 시 useBookings가 변경된 year/month로 호출된다', () => {
        render(<Profile />, { wrapper: createWrapper() });

        const now = new Date();
        const initialYear = now.getFullYear();
        const initialMonth = now.getMonth() + 1;

        expect(mockUseBookings).toHaveBeenCalledWith({
            username: 'testhost',
            year: initialYear,
            month: initialMonth,
        });

        mockUseBookings.mockClear();

        fireEvent.click(screen.getByTestId('next-month-btn'));

        const expectedMonth = initialMonth === 12 ? 1 : initialMonth + 1;
        const expectedYear = initialMonth === 12 ? initialYear + 1 : initialYear;

        expect(mockUseBookings).toHaveBeenCalledWith({
            username: 'testhost',
            year: expectedYear,
            month: expectedMonth,
        });
    });
});

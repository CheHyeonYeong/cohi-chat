import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Detail } from './Detail';
import type { IBookingDetail, IBookingFile } from '~/features/booking';

// Mock data
const mockBooking: IBookingDetail = {
    id: 1,
    startedAt: new Date('2026-03-20T10:00:00'),
    endedAt: new Date('2026-03-20T11:00:00'),
    topic: '커리어 상담',
    description: '프론트엔드 커리어에 대해 이야기',
    timeSlot: { id: 5, userId: 'host1-id', startedAt: '10:00', endedAt: '11:00', weekdays: [5], startDate: null, endDate: null, createdAt: '2026-03-15', updatedAt: '2026-03-15' },
    host: { username: 'host1', displayName: '홍길동' },
    guest: { username: 'guest1', displayName: '김철수' },
    files: [],
    createdAt: '2026-03-15',
    updatedAt: '2026-03-15',
    attendanceStatus: 'SCHEDULED',
    hostId: 'host1-id',
    guestId: 'guest1-id',
    meetingType: 'ONLINE',
    location: null,
    meetingLink: 'https://meet.google.com/test',
};

// Mocks
let mockBookingData = { data: mockBooking, isLoading: false, error: null, refetch: vi.fn() };
let mockCurrentUser = { data: { id: 'guest1-id', username: 'guest1', displayName: '김철수' }, isAuthenticated: true };
let mockHostCalendar = { data: { topics: ['커리어 상담', '기술 면접'], slug: 'host1' } };

vi.mock('@tanstack/react-router', () => ({
    useParams: () => ({ id: '1' }),
    Link: ({ children, ...props }: { children: ReactNode; to: string }) => <a {...props}>{children}</a>,
}));

vi.mock('~/features/booking', async () => {
    const actual = await vi.importActual<Record<string, unknown>>('~/features/booking');
    return {
        ...actual,
        useBooking: () => mockBookingData,
        useUploadBookingFile: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
        useDeleteBookingFile: () => ({ mutateAsync: vi.fn(), isPending: false }),
        useReportHostNoShow: () => ({ mutate: vi.fn(), isPending: false, error: null, reset: vi.fn() }),
        useDownloadBookingFile: () => ({ mutate: vi.fn() }),
        useNoShowHistory: () => ({ data: null }),
        BookingEditForm: ({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) => (
            <div data-testid="booking-edit-form">
                <button data-testid="booking-edit-cancel-button" onClick={onCancel}>취소</button>
                <button data-testid="booking-edit-save-button" onClick={onSuccess}>저장</button>
            </div>
        ),
        BookingMetaSection: ({ booking }: { booking: IBookingDetail }) => (
            <div data-testid="booking-meta-section">
                <span>{booking.topic}</span>
                <span>{booking.meetingType === 'ONLINE' ? '온라인' : '오프라인'}</span>
                {booking.meetingType === 'ONLINE' && booking.meetingLink && <a href={booking.meetingLink}>링크 열기</a>}
                {booking.meetingType === 'OFFLINE' && booking.location && <span>- {booking.location}</span>}
            </div>
        ),
        BookingHeader: ({ displayName, roleLabel, attendanceStatus, actions }: { displayName: string; roleLabel: string; attendanceStatus: string; actions?: ReactNode }) => (
            <div data-testid="booking-header">
                <span>{displayName}</span>
                <span>{roleLabel}</span>
                <span>{attendanceStatus}</span>
                {actions}
            </div>
        ),
        BookingFileSection: ({ files }: { files: IBookingFile[] }) => (
            <div data-testid="booking-file-section">파일 {files.length}개</div>
        ),
    };
});

vi.mock('~/features/member', () => ({
    useAuth: () => mockCurrentUser,
}));

vi.mock('~/features/host', () => ({
    useHostCalendar: () => mockHostCalendar,
}));

vi.mock('~/components', () => ({
    PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('~/components/button', () => ({
    Button: ({ children, ...props }: { children: ReactNode; [key: string]: unknown }) => (
        <button {...props}>{children}</button>
    ),
}));

vi.mock('~/components/card', () => ({
    Card: ({ children, title }: { children: ReactNode; title?: string }) => (
        <div>
            {title && <h3>{title}</h3>}
            {children}
        </div>
    ),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('Detail 페이지 수정 기능', () => {
    beforeEach(() => {
        mockBookingData = { data: { ...mockBooking }, isLoading: false, error: null, refetch: vi.fn() };
        mockCurrentUser = { data: { id: 'guest1-id', username: 'guest1', displayName: '김철수' }, isAuthenticated: true };
        mockHostCalendar = { data: { topics: ['커리어 상담', '기술 면접'], slug: 'host1' } };
    });

    it('게스트 + SCHEDULED → 수정 버튼 표시', () => {
        render(<Detail />, { wrapper: createWrapper() });
        expect(screen.getByTestId('booking-edit-button')).toBeInTheDocument();
    });

    it('호스트 → 수정 버튼 미표시', () => {
        mockCurrentUser = { data: { id: 'host1-id', username: 'host1', displayName: '홍길동' }, isAuthenticated: true };
        render(<Detail />, { wrapper: createWrapper() });
        expect(screen.queryByTestId('booking-edit-button')).not.toBeInTheDocument();
    });

    it('ATTENDED → 수정 버튼 미표시', () => {
        mockBookingData = {
            ...mockBookingData,
            data: { ...mockBooking, attendanceStatus: 'ATTENDED' },
        };
        render(<Detail />, { wrapper: createWrapper() });
        expect(screen.queryByTestId('booking-edit-button')).not.toBeInTheDocument();
    });

    it('CANCELLED → 수정 버튼 미표시', () => {
        mockBookingData = {
            ...mockBookingData,
            data: { ...mockBooking, attendanceStatus: 'CANCELLED' },
        };
        render(<Detail />, { wrapper: createWrapper() });
        expect(screen.queryByTestId('booking-edit-button')).not.toBeInTheDocument();
    });

    it('수정 클릭 → BookingEditForm 표시', () => {
        render(<Detail />, { wrapper: createWrapper() });
        fireEvent.click(screen.getByTestId('booking-edit-button'));
        expect(screen.getByTestId('booking-edit-form')).toBeInTheDocument();
    });

    it('취소 클릭 → 읽기 전용 복귀', () => {
        render(<Detail />, { wrapper: createWrapper() });
        fireEvent.click(screen.getByTestId('booking-edit-button'));
        expect(screen.getByTestId('booking-edit-form')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('booking-edit-cancel-button'));
        expect(screen.queryByTestId('booking-edit-form')).not.toBeInTheDocument();
    });

    it('미팅 방식 (온라인)을 표시한다', () => {
        render(<Detail />, { wrapper: createWrapper() });
        expect(screen.getByText('온라인')).toBeInTheDocument();
        expect(screen.getByText('링크 열기')).toBeInTheDocument();
    });

    it('미팅 방식 (오프라인)을 표시한다', () => {
        mockBookingData = {
            ...mockBookingData,
            data: { ...mockBooking, meetingType: 'OFFLINE', location: '스타벅스 강남역점', meetingLink: null },
        };
        render(<Detail />, { wrapper: createWrapper() });
        expect(screen.getByText('오프라인')).toBeInTheDocument();
        expect(screen.getByText(/스타벅스 강남역점/)).toBeInTheDocument();
    });
});

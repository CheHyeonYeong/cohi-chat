/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { IBookingDetail } from '~/features/calendar';

// 시간 기준: 2024-06-01 10:00 KST
const MOCK_NOW = new Date('2024-06-01T01:00:00Z');
const PAST_STARTED_AT = new Date('2024-06-01T00:30:00Z');   // 30분 전 시작 → 활성화
const FUTURE_STARTED_AT = new Date('2024-06-01T02:00:00Z'); // 1시간 후 시작 → 비활성화

const GUEST_ID = 'guest-uuid';
const HOST_ID = 'host-uuid';

const makeBooking = (startedAt: Date, attendanceStatus: IBookingDetail['attendanceStatus'] = 'SCHEDULED'): IBookingDetail => ({
    id: 1,
    startedAt,
    endedAt: new Date(startedAt.getTime() + 3_600_000),
    topic: '테스트 미팅',
    description: '설명',
    timeSlot: {
        id: 10,
        userId: HOST_ID,
        startedAt: '10:00',
        endedAt: '11:00',
        weekdays: [1],
        startDate: null,
        endDate: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    host: { username: 'host', displayName: '호스트' },
    hostId: HOST_ID,
    guestId: GUEST_ID,
    attendanceStatus,
    files: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
});

const reportNoShow = vi.fn();

vi.mock('@tanstack/react-router', () => ({
    useParams: () => ({ id: '1' }),
    Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

vi.mock('@dnd-kit/core', () => ({
    DndContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    PointerSensor: class {},
    KeyboardSensor: class {},
    useSensor: () => ({}),
    useSensors: (...args: unknown[]) => args,
    closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    sortableKeyboardCoordinates: vi.fn(),
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
    verticalListSortingStrategy: vi.fn(),
    arrayMove: (arr: unknown[]) => arr,
}));

vi.mock('@dnd-kit/utilities', () => ({
    CSS: { Transform: { toString: () => '' } },
}));

vi.mock('~/components/PageHeader', () => ({
    default: () => <div />,
}));

vi.mock('~/components/toast/useToast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('./bookingUploadUtils', () => ({
    canUploadMoreFiles: () => true,
}));

let mockBooking: IBookingDetail | null = null;

vi.mock('~/features/calendar', () => ({
    useBooking: () => ({ data: mockBooking, isLoading: false, error: null, refetch: vi.fn() }),
    useUploadBookingFile: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
    useDeleteBookingFile: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useReportHostNoShow: () => ({ mutate: reportNoShow, isPending: false, error: null, reset: vi.fn() }),
    getPresignedDownloadUrl: vi.fn(),
    AttendanceStatus: {},
}));

vi.mock('~/features/member', () => ({
    useAuth: () => ({ data: { id: GUEST_ID, username: 'guest' } }),
}));

import Booking from './Booking';

describe('노쇼 신고 버튼', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(MOCK_NOW);
        reportNoShow.mockClear();
        mockBooking = null;
    });

    afterEach(() => {
        vi.useRealTimers();
        mockBooking = null;
    });

    it('미팅 시작 전: 버튼이 비활성화(disabled) 상태로 표시된다', () => {
        mockBooking = makeBooking(FUTURE_STARTED_AT);

        render(<Booking />);

        const button = screen.getByRole('button', { name: '호스트 노쇼 신고' });
        expect(button).toBeDisabled();
        expect(screen.getByText('미팅 시작 이후부터 신고할 수 있습니다.')).toBeInTheDocument();
    });

    it('미팅 시작 후: 버튼이 활성화 상태로 표시된다', () => {
        mockBooking = makeBooking(PAST_STARTED_AT);

        render(<Booking />);

        const button = screen.getByRole('button', { name: '호스트 노쇼 신고' });
        expect(button).not.toBeDisabled();
        expect(screen.getByText('호스트가 약속 장소에 나타나지 않았나요? 신고를 통해 알려주세요.')).toBeInTheDocument();
    });

    it('미팅 시작 후: 버튼 클릭 시 신고 폼이 열린다', () => {
        mockBooking = makeBooking(PAST_STARTED_AT);

        render(<Booking />);

        fireEvent.click(screen.getByRole('button', { name: '호스트 노쇼 신고' }));

        expect(screen.getByPlaceholderText('신고 사유를 입력해주세요 (선택)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '신고하기' })).toBeInTheDocument();
    });

    it('이미 신고된 예약(HOST_NO_SHOW): 버튼 대신 안내 문구가 표시된다', () => {
        mockBooking = makeBooking(PAST_STARTED_AT, 'HOST_NO_SHOW');

        render(<Booking />);

        expect(screen.queryByRole('button', { name: '호스트 노쇼 신고' })).not.toBeInTheDocument();
        expect(screen.getByText('이미 신고한 예약입니다.')).toBeInTheDocument();
    });

    it('게스트가 아닌 경우: 신고 섹션이 표시되지 않는다', () => {
        mockBooking = { ...makeBooking(PAST_STARTED_AT), guestId: HOST_ID };

        render(<Booking />);

        expect(screen.queryByRole('button', { name: '호스트 노쇼 신고' })).not.toBeInTheDocument();
        expect(screen.queryByText('이미 신고한 예약입니다.')).not.toBeInTheDocument();
    });
});

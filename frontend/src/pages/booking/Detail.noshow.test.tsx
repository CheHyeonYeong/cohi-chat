/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { IBookingDetail } from '~/features/booking';

const MOCK_NOW = new Date('2024-06-01T01:00:00Z');
const PAST_STARTED_AT = new Date('2024-06-01T00:30:00Z');
const FUTURE_STARTED_AT = new Date('2024-06-01T02:00:00Z');

const GUEST_ID = 'guest-uuid';
const HOST_ID = 'host-uuid';

const makeBooking = (
    startedAt: Date,
    attendanceStatus: IBookingDetail['attendanceStatus'] = 'SCHEDULED',
): IBookingDetail => ({
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
    guest: { username: 'guest', displayName: '게스트' },
    hostId: HOST_ID,
    guestId: GUEST_ID,
    attendanceStatus,
    meetingType: 'ONLINE',
    location: null,
    meetingLink: 'https://meet.google.com/test',
    files: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
});

const reportNoShow = vi.fn();
let mockBooking: IBookingDetail | null = null;

vi.mock('@tanstack/react-router', () => ({
    useParams: () => ({ id: 1 }),
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

vi.mock('~/components', () => ({
    PageLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('./bookingUploadUtils', () => ({
    canUploadMoreFiles: () => true,
}));

vi.mock('~/components/toast/useToast', () => ({
    useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('~/features/booking', () => ({
    useBooking: () => ({ data: mockBooking, isLoading: false, error: null, refetch: vi.fn() }),
    useUploadBookingFile: () => ({ mutateAsync: vi.fn(), isPending: false, error: null }),
    useDeleteBookingFile: () => ({ mutateAsync: vi.fn(), isPending: false }),
    useDownloadBookingFile: () => ({ mutate: vi.fn() }),
    useReportHostNoShow: () => ({ mutate: reportNoShow, isPending: false, error: null, reset: vi.fn() }),
    useNoShowHistory: () => ({ data: null }),
    BookingHeader: ({ displayName, attendanceStatus }: { displayName: string; attendanceStatus: string }) => <div>{displayName} {attendanceStatus}</div>,
    BookingMetaSection: () => <div>meta</div>,
    BookingEditForm: () => <div>edit</div>,
    BookingFileSection: () => <div>files</div>,
}));

vi.mock('~/features/member', () => ({
    useAuth: () => ({ data: { id: GUEST_ID, username: 'guest' } }),
}));

vi.mock('~/features/host', () => ({
    useHostCalendar: () => ({ data: null }),
}));

import { Detail } from './Detail';

describe('Detail no-show reporting', () => {
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

    it('disables reporting before the meeting starts', () => {
        mockBooking = makeBooking(FUTURE_STARTED_AT);

        render(<Detail />);

        const button = screen.getByRole('button', { name: '호스트 노쇼 신고' });
        expect(button).toBeDisabled();
        expect(screen.getByText('미팅 시작 이후부터 신고할 수 있습니다.')).toBeInTheDocument();
    });

    it('enables reporting after the meeting starts', () => {
        mockBooking = makeBooking(PAST_STARTED_AT);

        render(<Detail />);

        const button = screen.getByRole('button', { name: '호스트 노쇼 신고' });
        expect(button).not.toBeDisabled();
        expect(screen.getByText('호스트가 약속 장소에 나타나지 않았나요? 신고를 통해 알려주세요.')).toBeInTheDocument();
    });

    it('keeps the report button enabled for guests after the meeting starts even when status is ATTENDED', () => {
        mockBooking = makeBooking(PAST_STARTED_AT, 'ATTENDED');

        render(<Detail />);

        const button = screen.getByRole('button', { name: '호스트 노쇼 신고' });
        expect(button).not.toBeDisabled();
    });

    it('opens the report form when the enabled button is clicked', () => {
        mockBooking = makeBooking(PAST_STARTED_AT);

        render(<Detail />);

        fireEvent.click(screen.getByRole('button', { name: '호스트 노쇼 신고' }));

        expect(screen.getByLabelText('신고 사유 (선택)')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '신고하기' })).toBeInTheDocument();
    });

    it('shows an already reported message for HOST_NO_SHOW bookings', () => {
        mockBooking = makeBooking(PAST_STARTED_AT, 'HOST_NO_SHOW');

        render(<Detail />);

        expect(screen.queryByRole('button', { name: '호스트 노쇼 신고' })).not.toBeInTheDocument();
        expect(screen.getByText('이미 신고한 예약입니다.')).toBeInTheDocument();
    });

    it('switches to the already reported state after a successful report', () => {
        mockBooking = makeBooking(PAST_STARTED_AT);
        reportNoShow.mockImplementation((_reason?: string, options?: { onSuccess?: () => void }) => {
            mockBooking = makeBooking(PAST_STARTED_AT, 'HOST_NO_SHOW');
            options?.onSuccess?.();
        });

        render(<Detail />);

        fireEvent.click(screen.getByRole('button', { name: '호스트 노쇼 신고' }));
        fireEvent.click(screen.getByRole('button', { name: '신고하기' }));

        expect(screen.queryByRole('button', { name: '호스트 노쇼 신고' })).not.toBeInTheDocument();
        expect(screen.getByText('이미 신고한 예약입니다.')).toBeInTheDocument();
    });

    it('hides the section for non-guests', () => {
        mockBooking = { ...makeBooking(PAST_STARTED_AT), guestId: HOST_ID };

        render(<Detail />);

        expect(screen.queryByRole('button', { name: '호스트 노쇼 신고' })).not.toBeInTheDocument();
        expect(screen.queryByText('이미 신고한 예약입니다.')).not.toBeInTheDocument();
    });
});

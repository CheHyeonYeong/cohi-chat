/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { IBookingWithRole } from '~/features/booking';
import { MyBookings } from './MyBookings';

const refetchMyBookings = vi.fn().mockResolvedValue(undefined);
const refetchSelectedBooking = vi.fn().mockResolvedValue(undefined);
const uploadFileAsync = vi.fn().mockResolvedValue({});
const deleteFileAsync = vi.fn().mockResolvedValue({});
const showToast = vi.fn();

const guestBooking: IBookingWithRole = {
    id: 1,
    startedAt: new Date('2024-02-15T10:00:00+09:00'),
    endedAt: new Date('2024-02-15T11:00:00+09:00'),
    topic: '테스트 주제',
    description: '테스트 설명',
    timeSlot: {
        id: 10,
        userId: 'host-uuid',
        startedAt: '10:00',
        endedAt: '11:00',
        weekdays: [4],
        startDate: null,
        endDate: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    host: { username: 'host', displayName: '호스트' },
    guest: { username: 'guest', displayName: '게스트' },
    hostId: 'host-uuid',
    guestId: 'guest-uuid',
    attendanceStatus: 'SCHEDULED',
    files: [],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    meetingType: 'ONLINE',
    location: null,
    meetingLink: 'https://meet.google.com/test',
    role: 'guest',
    counterpart: { username: 'host', displayName: '호스트' },
};

const hostBooking: IBookingWithRole = {
    id: 2,
    startedAt: new Date('2024-02-16T14:00:00+09:00'),
    endedAt: new Date('2024-02-16T15:00:00+09:00'),
    topic: '호스트 예약 주제',
    description: '호스트 설명',
    timeSlot: {
        id: 11,
        userId: 'host-uuid',
        startedAt: '14:00',
        endedAt: '15:00',
        weekdays: [5],
        startDate: null,
        endDate: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    host: { username: 'me', displayName: '나' },
    guest: { username: 'other-guest', displayName: '다른게스트' },
    hostId: 'my-uuid',
    guestId: 'other-guest-uuid',
    attendanceStatus: 'SCHEDULED',
    files: [],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    meetingType: 'OFFLINE',
    location: '강남역',
    meetingLink: null,
    role: 'host',
    counterpart: { username: 'other-guest', displayName: '다른게스트' },
};

const allMyBookingsResponse = {
    bookings: [hostBooking, guestBooking],
    totalCount: 2,
};

const mockSearchState = { page: 1, selectedId: undefined as number | undefined };
const mockNavigate = vi.fn().mockImplementation((opts: { search?: Record<string, unknown> }) => {
    if (opts.search) {
        // search 객체를 교체하여 누락된 키는 undefined로 처리
        mockSearchState.page = (opts.search.page as number) ?? 1;
        mockSearchState.selectedId = opts.search.selectedId as number | undefined;
    }
});
vi.mock('@tanstack/react-router', () => ({
    useSearch: () => mockSearchState,
    useNavigate: () => mockNavigate,
    useRouterState: () => ({ location: { pathname: '/booking/my-bookings' } }),
    Link: ({ children, to, ...props }: { children: ReactNode; to: string; [key: string]: unknown }) =>
        <a href={to as string} {...props}>{children}</a>,
    createLink: (component: unknown) => component,
}));

vi.mock('~/components/header', () => ({
    Header: () => <div data-testid="header" />,
}));

vi.mock('@dnd-kit/core', () => ({
    DndContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    PointerSensor: class {},
    useSensor: () => ({}),
    useSensors: (...args: unknown[]) => args,
    closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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

vi.mock('~/components/Pagination', () => ({
    Pagination: () => <div data-testid="pagination" />,
}));

vi.mock('~/components/button/LinkButton', () => ({
    LinkButton: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

vi.mock('~/components/toast/useToast', () => ({
    useToast: () => ({ showToast }),
}));

vi.mock('~/features/booking', () => ({
    useAllMyBookings: () => ({
        data: allMyBookingsResponse,
        isLoading: false,
        error: null,
        refetch: refetchMyBookings,
    }),
    useBooking: (id: number | null) => ({
        data: id ? allMyBookingsResponse.bookings.find(b => b.id === id) ?? null : null,
        refetch: refetchSelectedBooking,
    }),
    useUploadBookingFile: () => ({
        mutateAsync: uploadFileAsync,
        isPending: false,
        error: null,
        reset: vi.fn(),
    }),
    useDeleteBookingFile: () => ({
        mutateAsync: deleteFileAsync,
        isPending: false,
    }),
    useDownloadBookingFile: () => ({
        mutate: vi.fn(),
    }),
    BookingCard: ({ booking: b, onSelect, role }: { booking: IBookingWithRole; onSelect?: (id: number) => void; role?: string }) => (
        <button type="button" data-testid={`booking-card-${b.id}`} onClick={() => onSelect?.(b.id)}>
            {role && <span data-testid="booking-role-tag">{role === 'guest' ? '게스트' : '호스트'}</span>}
            select-booking-{b.id}
        </button>
    ),
    BookingDetailPanel: ({ onUpload }: { onUpload: (files: FileList) => void }) => (
        <div data-testid="booking-detail-panel">
            <button
                type="button"
                onClick={() => {
                    const files = [new File(['x'], 'resume.pdf', { type: 'application/pdf' })];
                    onUpload(files as unknown as FileList);
                }}
            >
                trigger-upload
            </button>
        </div>
    ),
}));

describe('MyBookings', () => {
    beforeEach(() => {
        refetchMyBookings.mockClear();
        refetchSelectedBooking.mockClear();
        uploadFileAsync.mockClear();
        showToast.mockClear();
        mockNavigate.mockClear();
        mockSearchState.page = 1;
        mockSearchState.selectedId = undefined;
    });

    it('does not refetch after upload fails', async () => {
        uploadFileAsync.mockRejectedValueOnce(new Error('업로드 실패'));
        mockSearchState.selectedId = 2;

        render(<MyBookings />);

        fireEvent.click(screen.getByRole('button', { name: 'trigger-upload' }));

        await waitFor(() => {
            expect(uploadFileAsync).toHaveBeenCalledTimes(1);
        });
        expect(showToast).not.toHaveBeenCalled();
        expect(refetchSelectedBooking).not.toHaveBeenCalled();
        expect(refetchMyBookings).not.toHaveBeenCalled();
    });

    it('refetches both selected booking and booking list after upload', async () => {
        mockSearchState.selectedId = 2;
        render(<MyBookings />);

        fireEvent.click(screen.getByRole('button', { name: 'trigger-upload' }));

        await waitFor(() => {
            expect(uploadFileAsync).toHaveBeenCalledTimes(1);
            expect(uploadFileAsync.mock.calls[0][0]).toBeInstanceOf(File);
            expect(refetchSelectedBooking).toHaveBeenCalledTimes(1);
            expect(refetchMyBookings).toHaveBeenCalledTimes(1);
        });
    });

    it('게스트와 호스트 예약 카드를 모두 렌더링해야 한다', () => {
        render(<MyBookings />);

        expect(screen.getByTestId('booking-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('booking-card-2')).toBeInTheDocument();
    });

    it('각 카드에 역할 태그가 표시되어야 한다', () => {
        render(<MyBookings />);

        const tags = screen.getAllByTestId('booking-role-tag');
        expect(tags).toHaveLength(2);

        const tagTexts = tags.map(t => t.textContent);
        expect(tagTexts).toContain('호스트');
        expect(tagTexts).toContain('게스트');
    });
});

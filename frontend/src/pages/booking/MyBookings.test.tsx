/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { IBookingDetail } from '~/features/booking';
import { MyBookings } from './MyBookings';

const refetchMyBookings = vi.fn().mockResolvedValue(undefined);
const refetchSelectedBooking = vi.fn().mockResolvedValue(undefined);
const uploadFileAsync = vi.fn().mockResolvedValue({});
const deleteFileAsync = vi.fn().mockResolvedValue({});

const booking: IBookingDetail = {
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
    hostId: 'host-uuid',
    guestId: 'guest-uuid',
    attendanceStatus: 'SCHEDULED',
    files: [],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
    meetingType: 'ONLINE',
    location: null,
    meetingLink: 'https://meet.google.com/test',
};

const myBookingsResponse = {
    bookings: [booking],
    totalCount: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1,
};

vi.mock('@tanstack/react-router', () => ({
    useSearch: () => ({ page: 1, pageSize: 10 }),
    useNavigate: () => vi.fn(),
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

vi.mock('~/features/booking', () => ({
    useMyBookings: () => ({
        data: myBookingsResponse,
        isLoading: false,
        error: null,
        refetch: refetchMyBookings,
    }),
    useBooking: (id: number | null) => ({
        data: id ? booking : null,
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
    getPresignedDownloadUrl: vi.fn(),
    BookingCard: ({ booking: b, onSelect }: { booking: IBookingDetail; onSelect?: (id: number) => void }) => (
        <button type="button" onClick={() => onSelect?.(b.id)}>
            select-booking
        </button>
    ),
    BookingDetailPanel: () => <div data-testid="booking-detail-panel" />,
    FileDropZone: ({ onFilesDropped }: { onFilesDropped: (files: FileList) => void }) => (
        <button
            type="button"
            onClick={() => {
                const files = [new File(['x'], 'resume.pdf', { type: 'application/pdf' })];
                onFilesDropped(files as unknown as FileList);
            }}
        >
            trigger-upload
        </button>
    ),
}));

describe('MyBookings upload refresh', () => {
    beforeEach(() => {
        refetchMyBookings.mockClear();
        refetchSelectedBooking.mockClear();
        uploadFileAsync.mockClear();
    });

    it('refetches both selected booking and booking list after upload', async () => {
        render(<MyBookings />);

        fireEvent.click(screen.getByRole('button', { name: 'select-booking' }));
        fireEvent.click(screen.getByRole('button', { name: 'trigger-upload' }));

        await waitFor(() => {
            expect(uploadFileAsync).toHaveBeenCalledTimes(1);
            expect(uploadFileAsync.mock.calls[0][0]).toBeInstanceOf(File);
            expect(refetchSelectedBooking).toHaveBeenCalledTimes(1);
            expect(refetchMyBookings).toHaveBeenCalledTimes(1);
        });
    });
});

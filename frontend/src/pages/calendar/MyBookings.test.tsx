/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { IBookingDetail } from '~/features/calendar';
import MyBookings from './MyBookings';

const refetchMyBookings = vi.fn().mockResolvedValue(undefined);
const refetchSelectedBooking = vi.fn().mockResolvedValue(undefined);
const uploadFileAsync = vi.fn().mockResolvedValue({});

const booking: IBookingDetail = {
    id: 1,
    when: new Date('2024-02-15'),
    topic: '테스트 주제',
    description: '테스트 설명',
    timeSlot: {
        id: 10,
        userId: 'host-uuid',
        startTime: '10:00',
        endTime: '11:00',
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

vi.mock('~/components/PageHeader', () => ({
    default: () => <div data-testid="page-header" />,
}));

vi.mock('~/components/Pagination', () => ({
    default: () => <div data-testid="pagination" />,
}));

vi.mock('~/components/button/LinkButton', () => ({
    default: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));

vi.mock('~/features/calendar/components/BookingCard', () => ({
    default: ({ booking: b, onSelect }: { booking: IBookingDetail; onSelect?: (id: number) => void }) => (
        <button type="button" onClick={() => onSelect?.(b.id)}>
            select-booking
        </button>
    ),
}));

vi.mock('~/features/calendar/components/BookingDetailPanel', () => ({
    default: () => <div data-testid="booking-detail-panel" />,
}));

vi.mock('~/features/calendar/components/FileDropZone', () => ({
    default: ({ onFilesDropped }: { onFilesDropped: (files: FileList) => void }) => (
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

vi.mock('~/features/calendar', () => ({
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
    }),
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
            expect(refetchSelectedBooking).toHaveBeenCalledTimes(1);
            expect(refetchMyBookings).toHaveBeenCalledTimes(1);
        });
    });
});

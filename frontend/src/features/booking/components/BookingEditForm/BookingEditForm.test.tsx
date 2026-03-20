import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BookingEditForm } from './BookingEditForm';
import type { IBookingDetail } from '../../types';

let mockMutation = {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null as Error | null,
};

vi.mock('../../hooks/useUpdateBooking', () => ({
    useUpdateBooking: () => mockMutation,
}));

const createWrapper = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

const mockBooking: IBookingDetail = {
    id: 1,
    startedAt: new Date('2026-03-20T10:00:00'),
    endedAt: new Date('2026-03-20T11:00:00'),
    topic: '커리어 상담',
    description: '프론트엔드 커리어에 대해 이야기하고 싶습니다',
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

const mockTopics = ['커리어 상담', '기술 면접', '이력서 리뷰'];

describe('BookingEditForm', () => {
    beforeEach(() => {
        mockMutation = {
            mutate: vi.fn(),
            isPending: false,
            isError: false,
            error: null,
        };
    });

    it('booking 값으로 폼을 초기화한다', () => {
        const onCancel = vi.fn();
        const onSuccess = vi.fn();

        render(
            <BookingEditForm booking={mockBooking} topics={mockTopics} onCancel={onCancel} onSuccess={onSuccess} />,
            { wrapper: createWrapper() },
        );

        expect(screen.getByTestId('booking-edit-form')).toBeInTheDocument();
        expect(screen.getByTestId('booking-edit-description-textarea')).toHaveValue(
            '프론트엔드 커리어에 대해 이야기하고 싶습니다',
        );
    });

    it('저장 시 mutation을 호출한다', () => {
        const onCancel = vi.fn();
        const onSuccess = vi.fn();

        render(
            <BookingEditForm booking={mockBooking} topics={mockTopics} onCancel={onCancel} onSuccess={onSuccess} />,
            { wrapper: createWrapper() },
        );

        fireEvent.click(screen.getByTestId('booking-edit-save-button'));

        expect(mockMutation.mutate).toHaveBeenCalledWith(
            expect.objectContaining({
                timeSlotId: 5,
                when: '2026-03-20',
                topic: '커리어 상담',
                description: '프론트엔드 커리어에 대해 이야기하고 싶습니다',
                meetingType: 'ONLINE',
                meetingLink: 'https://meet.google.com/test',
            }),
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
    });

    it('저장 성공 시 onSuccess 콜백을 호출한다', async () => {
        const onCancel = vi.fn();
        const onSuccess = vi.fn();

        mockMutation.mutate = vi.fn((_data, options) => {
            options?.onSuccess?.();
        });

        render(
            <BookingEditForm booking={mockBooking} topics={mockTopics} onCancel={onCancel} onSuccess={onSuccess} />,
            { wrapper: createWrapper() },
        );

        fireEvent.click(screen.getByTestId('booking-edit-save-button'));

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled();
        });
    });

    it('취소 시 onCancel 콜백을 호출한다', () => {
        const onCancel = vi.fn();
        const onSuccess = vi.fn();

        render(
            <BookingEditForm booking={mockBooking} topics={mockTopics} onCancel={onCancel} onSuccess={onSuccess} />,
            { wrapper: createWrapper() },
        );

        fireEvent.click(screen.getByTestId('booking-edit-cancel-button'));

        expect(onCancel).toHaveBeenCalled();
    });

    it('에러 메시지를 표시한다', () => {
        mockMutation.isError = true;
        mockMutation.error = new Error('수정에 실패했습니다');

        const onCancel = vi.fn();
        const onSuccess = vi.fn();

        render(
            <BookingEditForm booking={mockBooking} topics={mockTopics} onCancel={onCancel} onSuccess={onSuccess} />,
            { wrapper: createWrapper() },
        );

        expect(screen.getByTestId('booking-edit-error')).toHaveTextContent('수정에 실패했습니다');
    });
});

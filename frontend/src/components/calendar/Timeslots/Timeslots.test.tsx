import type { ReactElement, ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Timeslots } from './Timeslots';
import type { ITimeSlot } from '../types';

vi.mock('~/features/member', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to }: { children: ReactNode; to: string }) => (
        <a href={to}>{children}</a>
    ),
}));

import { useAuth } from '~/features/member';

const createTimeslot = (id: number, startedAt: string, endedAt: string): ITimeSlot => ({
    id,
    userId: 'test-user',
    startedAt,
    endedAt,
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    startDate: null,
    endDate: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
});

const createQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

const renderWithProviders = (ui: ReactElement) => {
    const queryClient = createQueryClient();
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('Timeslots', () => {
    const baseDate = new Date(2024, 5, 15);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('비로그인 상태', () => {
        beforeEach(() => {
            vi.mocked(useAuth).mockReturnValue({
                isAuthenticated: false,
                data: undefined,
                isLoading: false,
            } as unknown as ReturnType<typeof useAuth>);
        });

        it('로그인 링크를 표시한다', () => {
            renderWithProviders(
                <Timeslots
                    baseDate={baseDate}
                    timeslots={[createTimeslot(1, '10:00', '11:00')]}
                    bookings={[]}
                    onSelectTimeslot={vi.fn()}
                />,
            );

            expect(screen.getByText('로그인 후 커피챗 신청하기')).toBeInTheDocument();
        });

        it('로그인 링크는 /login으로 연결된다', () => {
            renderWithProviders(
                <Timeslots
                    baseDate={baseDate}
                    timeslots={[createTimeslot(1, '10:00', '11:00')]}
                    bookings={[]}
                    onSelectTimeslot={vi.fn()}
                />,
            );

            const link = screen.getByText('로그인 후 커피챗 신청하기');
            expect(link).toHaveAttribute('href', '/login');
        });
    });

    describe('로그인 상태', () => {
        beforeEach(() => {
            vi.mocked(useAuth).mockReturnValue({
                isAuthenticated: true,
                data: { id: 1, username: 'test', displayName: 'Test User', isHost: false },
                isLoading: false,
            } as unknown as ReturnType<typeof useAuth>);
        });

        it('타임슬롯이 없으면 안내 메시지를 표시한다', () => {
            renderWithProviders(
                <Timeslots
                    baseDate={baseDate}
                    timeslots={[]}
                    bookings={[]}
                    onSelectTimeslot={vi.fn()}
                />,
            );

            expect(screen.getByText('예약 가능한 시간대가 없는 날입니다.')).toBeInTheDocument();
        });

        it('이용 가능한 타임슬롯을 표시한다', () => {
            renderWithProviders(
                <Timeslots
                    baseDate={baseDate}
                    timeslots={[
                        createTimeslot(1, '10:00', '11:00'),
                        createTimeslot(2, '14:00', '15:00'),
                    ]}
                    bookings={[]}
                    onSelectTimeslot={vi.fn()}
                />,
            );

            expect(screen.getByText('10:00')).toBeInTheDocument();
            expect(screen.getByText('14:00')).toBeInTheDocument();
        });

        it('타임슬롯을 시간순으로 정렬하여 표시한다', () => {
            renderWithProviders(
                <Timeslots
                    baseDate={baseDate}
                    timeslots={[
                        createTimeslot(2, '14:00', '15:00'),
                        createTimeslot(1, '10:00', '11:00'),
                    ]}
                    bookings={[]}
                    onSelectTimeslot={vi.fn()}
                />,
            );

            const buttons = screen.getAllByRole('button');
            expect(buttons[0]).toHaveTextContent('10:00');
            expect(buttons[1]).toHaveTextContent('14:00');
        });

        it('타임슬롯 클릭 시 onSelectTimeslot이 호출된다', async () => {
            const onSelectTimeslot = vi.fn();
            const timeslot = createTimeslot(1, '10:00', '11:00');

            renderWithProviders(
                <Timeslots
                    baseDate={baseDate}
                    timeslots={[timeslot]}
                    bookings={[]}
                    onSelectTimeslot={onSelectTimeslot}
                />,
            );

            await userEvent.click(screen.getByText('10:00'));

            expect(onSelectTimeslot).toHaveBeenCalledWith(timeslot);
        });
    });

    describe('날짜 표시', () => {
        beforeEach(() => {
            vi.mocked(useAuth).mockReturnValue({
                isAuthenticated: true,
                data: { id: 1, username: 'test', displayName: 'Test User', isHost: false },
                isLoading: false,
            } as unknown as ReturnType<typeof useAuth>);
        });

        it('선택된 날짜를 헤더에 표시한다', () => {
            renderWithProviders(
                <Timeslots
                    baseDate={baseDate}
                    timeslots={[createTimeslot(1, '10:00', '11:00')]}
                    bookings={[]}
                    onSelectTimeslot={vi.fn()}
                />,
            );

            expect(screen.getByText('2024년 6월 15일')).toBeInTheDocument();
        });
    });
});

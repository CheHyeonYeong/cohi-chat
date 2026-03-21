import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Timeslots } from './Timeslots';
import type { ITimeSlot } from '../types';
import { useAuth } from '~/features/member';

vi.mock('~/features/member', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

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

const renderWithProviders = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('Timeslots', () => {
    const baseDate = new Date(2024, 5, 15);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows the login link for unauthenticated users', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            data: undefined,
            isLoading: false,
        } as unknown as ReturnType<typeof useAuth>);

        renderWithProviders(
            <Timeslots
                baseDate={baseDate}
                timeslots={[createTimeslot(1, '10:00', '11:00')]}
                bookings={[]}
                onSelectTimeslot={vi.fn()}
            />,
        );

        const loginLink = screen.getByRole('link');
        expect(loginLink).toHaveAttribute('href', '/login');
        expect(screen.queryByLabelText('auth-loading')).not.toBeInTheDocument();
    });

    it('shows an auth-loading status while auth is unresolved', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
            data: undefined,
            isLoading: true,
        } as unknown as ReturnType<typeof useAuth>);

        renderWithProviders(
            <Timeslots
                baseDate={baseDate}
                timeslots={[createTimeslot(1, '10:00', '11:00')]}
                bookings={[]}
                onSelectTimeslot={vi.fn()}
            />,
        );

        expect(screen.getByLabelText('auth-loading')).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('renders available timeslots in chronological order for authenticated users', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            data: { id: 1, username: 'guest', displayName: 'Guest', isHost: false },
            isLoading: false,
        } as unknown as ReturnType<typeof useAuth>);

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
        expect(buttons).toHaveLength(2);
        expect(buttons[0]).toHaveTextContent('10:00');
        expect(buttons[1]).toHaveTextContent('14:00');
    });

    it('calls onSelectTimeslot when a timeslot is clicked', async () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            data: { id: 1, username: 'guest', displayName: 'Guest', isHost: false },
            isLoading: false,
        } as unknown as ReturnType<typeof useAuth>);
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

        await userEvent.click(screen.getByRole('button'));

        expect(onSelectTimeslot).toHaveBeenCalledWith(timeslot);
    });

    it('shows the empty state for authenticated users without bookable timeslots', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
            data: { id: 1, username: 'guest', displayName: 'Guest', isHost: false },
            isLoading: false,
        } as unknown as ReturnType<typeof useAuth>);

        renderWithProviders(
            <Timeslots
                baseDate={baseDate}
                timeslots={[]}
                bookings={[]}
                onSelectTimeslot={vi.fn()}
            />,
        );

        expect(screen.getByRole('status')).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});

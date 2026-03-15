import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useAuth } from '~/features/member/hooks/useAuth';
import { useMyBookings } from './useBooking';
import { bookingKeys } from './queryKeys';
import { getMyBookings } from '../api';
import type { AuthUser } from '~/features/member';
import type { IPaginatedBookingDetail } from '../types';

vi.mock('~/features/member/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../api', () => ({
    API_URL: 'http://localhost:8080/api',
    getBookingsByDate: vi.fn(),
    getMyBookings: vi.fn(),
    getBooking: vi.fn(),
    uploadBookingFileWithPresignedUrl: vi.fn(),
    deleteBookingFile: vi.fn(),
}));

describe('useMyBookings', () => {
    let queryClient: QueryClient;
    const baseBooking = {
        startedAt: new Date('2026-03-15T10:00:00.000Z'),
        endedAt: new Date('2026-03-15T11:00:00.000Z'),
        topic: 'topic',
        description: 'description',
        timeSlot: {
            id: 1,
            userId: 'host-1',
            startedAt: '2026-03-15T10:00:00.000Z',
            endedAt: '2026-03-15T11:00:00.000Z',
            weekdays: [1],
            startDate: null,
            endDate: null,
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-01T00:00:00.000Z',
        },
        host: {
            username: 'host',
            displayName: 'Host',
        },
        files: [],
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        attendanceStatus: 'SCHEDULED' as const,
        hostId: 'host-1',
        guestId: 'guest-1',
    };

    const createWrapper = () => ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

    const createAuthResult = (user: AuthUser | null, isAuthenticated = !!user) => ({
        data: user,
        isAuthenticated,
        isLoading: false,
        isError: false,
        isSuccess: !!user,
        error: null,
        status: user ? 'success' : 'pending',
        fetchStatus: 'idle',
        refetch: vi.fn(),
        invalidateAuth: vi.fn(),
    });

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        vi.clearAllMocks();
    });

    it('uses a username-scoped cache key so another user cannot reuse previous booking data', async () => {
        const aliceData: IPaginatedBookingDetail = {
            bookings: [{ ...baseBooking, id: 1 }],
            totalCount: 1,
        };
        const bobData: IPaginatedBookingDetail = {
            bookings: [{ ...baseBooking, id: 2, guestId: 'guest-2' }],
            totalCount: 1,
        };

        queryClient.setQueryData(bookingKeys.myBookings(1, 10, 'alice'), aliceData);
        vi.mocked(useAuth).mockReturnValue(
            createAuthResult({
                id: 'member-2',
                username: 'bob',
                displayName: 'Bob',
                email: 'bob@example.com',
                role: 'GUEST',
                createdAt: '2026-03-01T00:00:00.000Z',
                updatedAt: '2026-03-01T00:00:00.000Z',
                isHost: false,
            }) as ReturnType<typeof useAuth>
        );
        vi.mocked(getMyBookings).mockResolvedValue(bobData);

        const { result } = renderHook(() => useMyBookings({ page: 1, pageSize: 10 }), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual(bobData);
        expect(getMyBookings).toHaveBeenCalledTimes(1);
        expect(queryClient.getQueryData(bookingKeys.myBookings(1, 10, 'alice'))).toEqual(aliceData);
        expect(queryClient.getQueryData(bookingKeys.myBookings(1, 10, 'bob'))).toEqual(bobData);
    });

    it('does not run when auth state has no current user', () => {
        vi.mocked(useAuth).mockReturnValue(createAuthResult(null, false) as ReturnType<typeof useAuth>);

        const { result } = renderHook(() => useMyBookings({ page: 1, pageSize: 10 }), {
            wrapper: createWrapper(),
        });

        expect(result.current.fetchStatus).toBe('idle');
        expect(getMyBookings).not.toHaveBeenCalled();
    });
});

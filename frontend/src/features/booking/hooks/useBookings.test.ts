import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { getCurrentUsername } from '~/libs/jwt';
import { useMyBookings } from './useBooking';
import { bookingKeys } from './queryKeys';
import { getMyBookings } from '../api';

vi.mock('~/libs/jwt', () => ({
    getCurrentUsername: vi.fn(),
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

    const createWrapper = () => ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        vi.clearAllMocks();
    });

    it('uses a username-scoped cache key so another user cannot reuse previous booking data', async () => {
        const aliceData = { bookings: [{ id: 1 }], totalCount: 1 };
        const bobData = { bookings: [{ id: 2 }], totalCount: 1 };

        queryClient.setQueryData(bookingKeys.myBookings(1, 10, 'alice'), aliceData);
        vi.mocked(getCurrentUsername).mockReturnValue('bob');
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
});
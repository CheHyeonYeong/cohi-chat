import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuth } from '~/features/member/hooks/useAuth';
import { useBooking, useMyBookings } from './useBooking';
import { bookingKeys } from './queryKeys';
import { getBooking, getMyBookings } from '../api';
import type { AuthUser } from '~/features/member';
import type { IBookingDetail, IPaginatedBookingDetail } from '../types';

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

describe('booking hooks cache isolation', () => {
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

    const createBookingDetail = (overrides: Partial<IBookingDetail> = {}) =>
        ({ ...baseBooking, ...overrides }) as unknown as IBookingDetail;

    const createWrapper = () => ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const createAuthResult = ({
        user,
        username = user?.username ?? null,
        isAuthenticated = !!username,
    }: {
        user: AuthUser | null;
        username?: string | null;
        isAuthenticated?: boolean;
    }) => ({
        data: user,
        username,
        isAuthenticated,
        isLoading: false,
        isError: false,
        isSuccess: !!user,
        error: null,
        status: user ? 'success' : 'pending',
        fetchStatus: 'idle',
        refetch: vi.fn(),
        invalidateAuth: vi.fn(),
    }) as unknown as ReturnType<typeof useAuth>;

    const createUser = (username: string): AuthUser => ({
        id: `member-${username}`,
        username,
        displayName: username.toUpperCase(),
        email: `${username}@example.com`,
        role: 'GUEST',
        createdAt: '2026-03-01T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
        isHost: false,
    });

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        vi.clearAllMocks();
    });

    describe('useMyBookings', () => {
        it('uses a username-scoped cache key so another user cannot reuse previous booking data', async () => {
            const aliceData: IPaginatedBookingDetail = {
                bookings: [createBookingDetail({ id: 1 })],
                totalCount: 1,
            };
            const bobData: IPaginatedBookingDetail = {
                bookings: [createBookingDetail({ id: 2, guestId: 'guest-2' })],
                totalCount: 1,
            };

            queryClient.setQueryData(bookingKeys.myBookings(1, 10, 'alice'), aliceData);
            vi.mocked(useAuth).mockReturnValue(
                createAuthResult({
                    user: createUser('bob'),
                })
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

        it('keeps booking query enabled while auth profile data is still loading if token username exists', async () => {
            const bobData: IPaginatedBookingDetail = {
                bookings: [createBookingDetail({ id: 2, guestId: 'guest-2' })],
                totalCount: 1,
            };

            vi.mocked(useAuth).mockReturnValue(
                createAuthResult({
                    user: null,
                    username: 'bob',
                    isAuthenticated: true,
                })
            );
            vi.mocked(getMyBookings).mockResolvedValue(bobData);

            const { result } = renderHook(() => useMyBookings({ page: 1, pageSize: 10 }), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(getMyBookings).toHaveBeenCalledTimes(1);
            expect(queryClient.getQueryData(bookingKeys.myBookings(1, 10, 'bob'))).toEqual(bobData);
        });

        it('does not run when auth state has no current user', () => {
            vi.mocked(useAuth).mockReturnValue(
                createAuthResult({
                    user: null,
                    username: null,
                    isAuthenticated: false,
                })
            );

            const { result } = renderHook(() => useMyBookings({ page: 1, pageSize: 10 }), {
                wrapper: createWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
            expect(getMyBookings).not.toHaveBeenCalled();
        });
    });

    describe('useBooking', () => {
        it('uses a username-scoped cache key so another user cannot reuse previous booking detail data', async () => {
            const aliceDetail = createBookingDetail({
                id: 1,
                topic: 'alice topic',
            });
            const bobDetail = createBookingDetail({
                id: 1,
                topic: 'bob topic',
                guestId: 'guest-2',
            });

            queryClient.setQueryData(bookingKeys.booking(1, 'alice'), aliceDetail);
            vi.mocked(useAuth).mockReturnValue(
                createAuthResult({
                    user: createUser('bob'),
                })
            );
            vi.mocked(getBooking).mockResolvedValue(bobDetail);

            const { result } = renderHook(() => useBooking(1), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(bobDetail);
            expect(getBooking).toHaveBeenCalledWith(1);
            expect(queryClient.getQueryData(bookingKeys.booking(1, 'alice'))).toEqual(aliceDetail);
            expect(queryClient.getQueryData(bookingKeys.booking(1, 'bob'))).toEqual(bobDetail);
        });

        it('keeps detail query enabled while auth profile data is still loading if token username exists', async () => {
            const bobDetail = createBookingDetail({
                id: 7,
                guestId: 'guest-2',
            });

            vi.mocked(useAuth).mockReturnValue(
                createAuthResult({
                    user: null,
                    username: 'bob',
                    isAuthenticated: true,
                })
            );
            vi.mocked(getBooking).mockResolvedValue(bobDetail);

            const { result } = renderHook(() => useBooking(7), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(getBooking).toHaveBeenCalledWith(7);
            expect(queryClient.getQueryData(bookingKeys.booking(7, 'bob'))).toEqual(bobDetail);
        });

        it('does not run when auth state has no current user', () => {
            vi.mocked(useAuth).mockReturnValue(
                createAuthResult({
                    user: null,
                    username: null,
                    isAuthenticated: false,
                })
            );

            const { result } = renderHook(() => useBooking(1), {
                wrapper: createWrapper(),
            });

            expect(result.current.fetchStatus).toBe('idle');
            expect(getBooking).not.toHaveBeenCalled();
        });
    });
});

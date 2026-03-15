import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useLogin } from './useLogin';
import { loginApi } from '../api/memberApi';
import { saveAuthTokens } from '../utils/authStorage';

vi.mock('../api/memberApi', () => ({
    loginApi: vi.fn(),
}));

vi.mock('../utils/authStorage', () => ({
    saveAuthTokens: vi.fn(),
}));

describe('useLogin', () => {
    let queryClient: QueryClient;

    const createWrapper = () => ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

        vi.clearAllMocks();
    });

    it('clears booking caches before saving new auth tokens', async () => {
        const response = {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiredInMinutes: 60,
            username: 'bob',
            displayName: 'Bob',
        };

        queryClient.setQueryData(['my-bookings', 'alice', 1, 10], { bookings: [{ id: 1 }], totalCount: 1 });
        queryClient.setQueryData(['booking', 1, 'alice'], { id: 1, topic: 'Alice booking' });

        vi.mocked(loginApi).mockResolvedValue(response);

        const { result } = renderHook(() => useLogin(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync({ username: 'bob', password: 'secret' });

        await waitFor(() => {
            expect(saveAuthTokens).toHaveBeenCalledWith(response);
        });

        expect(queryClient.getQueryData(['my-bookings', 'alice', 1, 10])).toBeUndefined();
        expect(queryClient.getQueryData(['booking', 1, 'alice'])).toBeUndefined();
    });

    it('clears previously cached booking data on repeated account switches', async () => {
        const bobResponse = {
            accessToken: 'bob-access-token',
            refreshToken: 'bob-refresh-token',
            expiredInMinutes: 60,
            username: 'bob',
            displayName: 'Bob',
        };
        const aliceResponse = {
            accessToken: 'alice-access-token',
            refreshToken: 'alice-refresh-token',
            expiredInMinutes: 60,
            username: 'alice',
            displayName: 'Alice',
        };

        vi.mocked(loginApi)
            .mockResolvedValueOnce(bobResponse)
            .mockResolvedValueOnce(aliceResponse);

        const { result } = renderHook(() => useLogin(), {
            wrapper: createWrapper(),
        });

        queryClient.setQueryData(['my-bookings', 'alice', 1, 10], { bookings: [{ id: 1 }], totalCount: 1 });
        queryClient.setQueryData(['booking', 1, 'alice'], { id: 1, topic: 'Alice booking' });

        await result.current.mutateAsync({ username: 'bob', password: 'secret' });

        expect(queryClient.getQueryData(['my-bookings', 'alice', 1, 10])).toBeUndefined();
        expect(queryClient.getQueryData(['booking', 1, 'alice'])).toBeUndefined();

        queryClient.setQueryData(['my-bookings', 'bob', 1, 10], { bookings: [{ id: 2 }], totalCount: 1 });
        queryClient.setQueryData(['booking', 2, 'bob'], { id: 2, topic: 'Bob booking' });

        await result.current.mutateAsync({ username: 'alice', password: 'secret' });

        await waitFor(() => {
            expect(saveAuthTokens).toHaveBeenNthCalledWith(1, bobResponse);
            expect(saveAuthTokens).toHaveBeenNthCalledWith(2, aliceResponse);
        });

        expect(queryClient.getQueryData(['my-bookings', 'bob', 1, 10])).toBeUndefined();
        expect(queryClient.getQueryData(['booking', 2, 'bob'])).toBeUndefined();
    });
});

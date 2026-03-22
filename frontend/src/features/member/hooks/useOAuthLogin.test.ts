import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useOAuthLogin } from './useOAuthLogin';
import { oAuthCallbackApi } from '../api/oAuthApi';
import { saveAuthenticatedUser } from '../utils/authStorage';
import { bookingKeys } from '../../booking/hooks/queryKeys';

vi.mock('../api/oAuthApi', () => ({
    oAuthCallbackApi: vi.fn(),
}));

vi.mock('../utils/authStorage', () => ({
    saveAuthenticatedUser: vi.fn(),
}));

describe('useOAuthLogin', () => {
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

    it('clears booking caches before saving OAuth auth tokens', async () => {
        const response = {
            accessToken: 'oauth-access-token',
            refreshToken: 'oauth-refresh-token',
            expiredInMinutes: 60,
            username: 'oauth-bob',
            displayName: 'OAuth Bob',
        };

        queryClient.setQueryData(bookingKeys.myBookings(1, 10, 'alice'), { bookings: [{ id: 1 }], totalCount: 1 });
        queryClient.setQueryData(bookingKeys.booking(1, 'alice'), { id: 1, topic: 'Alice booking' });

        vi.mocked(oAuthCallbackApi).mockResolvedValue(response);

        const { result } = renderHook(() => useOAuthLogin(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync({ provider: 'google', code: 'code', state: 'state' });

        await waitFor(() => {
            expect(saveAuthenticatedUser).toHaveBeenCalledTimes(1);
        });

        expect(queryClient.getQueryData(bookingKeys.myBookings(1, 10, 'alice'))).toBeUndefined();
        expect(queryClient.getQueryData(bookingKeys.booking(1, 'alice'))).toBeUndefined();
    });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { useOAuthLogin } from './useOAuthLogin';
import { oAuthCallbackApi } from '../api/oAuthApi';
import { saveAuthTokens } from '../utils/authStorage';

vi.mock('../api/oAuthApi', () => ({
    oAuthCallbackApi: vi.fn(),
}));

vi.mock('../utils/authStorage', () => ({
    saveAuthTokens: vi.fn(),
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

        queryClient.setQueryData(['my-bookings', 'alice', 1, 10], { bookings: [{ id: 1 }], totalCount: 1 });
        queryClient.setQueryData(['booking', 1, 'alice'], { id: 1, topic: 'Alice booking' });

        vi.mocked(oAuthCallbackApi).mockResolvedValue(response);

        const { result } = renderHook(() => useOAuthLogin(), {
            wrapper: createWrapper(),
        });

        await result.current.mutateAsync({ provider: 'google', code: 'code', state: 'state' });

        await waitFor(() => {
            expect(saveAuthTokens).toHaveBeenCalledWith(response);
        });

        expect(queryClient.getQueryData(['my-bookings', 'alice', 1, 10])).toBeUndefined();
        expect(queryClient.getQueryData(['booking', 1, 'alice'])).toBeUndefined();
    });
});
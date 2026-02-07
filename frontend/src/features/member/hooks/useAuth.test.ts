import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { httpClient } from '~/libs/httpClient';
import { getCurrentUsername, getValidToken } from '~/libs/jwt';
import { useAuth } from './useAuth';

vi.mock('~/libs/httpClient', () => ({
    httpClient: vi.fn(),
}));

vi.mock('~/libs/jwt', () => ({
    getValidToken: vi.fn(),
    getCurrentUsername: vi.fn(),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useAuth', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('endpoint', () => {
        it('calls /members/v1/{username} using username from JWT', async () => {
            vi.mocked(getValidToken).mockReturnValue('valid-token');
            vi.mocked(getCurrentUsername).mockReturnValue('testuser');

            const mockMemberResponse = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                username: 'testuser',
                displayName: 'Test User',
                email: 'test@example.com',
                role: 'HOST',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            };

            vi.mocked(httpClient).mockResolvedValue(mockMemberResponse);

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(httpClient).toHaveBeenCalledWith(
                expect.stringContaining('/members/v1/testuser')
            );
        });

        it('does not run query when token is missing', () => {
            vi.mocked(getValidToken).mockReturnValue(null);
            vi.mocked(getCurrentUsername).mockReturnValue(null);

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            expect(httpClient).not.toHaveBeenCalled();
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('role mapping', () => {
        it('sets isHost to true when role is HOST', async () => {
            vi.mocked(getValidToken).mockReturnValue('valid-token');
            vi.mocked(getCurrentUsername).mockReturnValue('testuser');

            const mockMemberResponse = {
                id: '550e8400-e29b-41d4-a716-446655440000',
                username: 'testuser',
                displayName: 'Test User',
                email: 'test@example.com',
                role: 'HOST',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            };

            vi.mocked(httpClient).mockResolvedValue(mockMemberResponse);

            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data?.isHost).toBe(true);
        });
    });
});

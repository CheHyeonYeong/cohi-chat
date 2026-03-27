import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { httpClient } from '~/libs/httpClient';
import { useAuth } from './useAuth';

vi.mock('~/libs/httpClient', () => ({
    httpClient: vi.fn(),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useAuth', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    describe('endpoint', () => {
        it('calls /members/v1/{username} using stored username', async () => {
            localStorage.setItem('username', 'testuser');

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
            expect(result.current.isAuthenticated).toBe(true);
        });

        it('does not run query when username is missing', () => {
            const { result } = renderHook(() => useAuth(), {
                wrapper: createWrapper(),
            });

            expect(httpClient).not.toHaveBeenCalled();
            expect(result.current.isAuthenticated).toBe(false);
        });
    });

    describe('role mapping', () => {
        it('sets isHost to true when role is HOST', async () => {
            localStorage.setItem('username', 'testuser');

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

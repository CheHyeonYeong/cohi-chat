import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { httpClient } from '~/libs/httpClient';
import { dispatchAuthChange } from '../utils/authEvent';
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

    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls /members/v1/me to resolve the current authenticated user', async () => {
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
            expect.stringContaining('/members/v1/me'),
            expect.objectContaining({ clearAuthOnFailure: false }),
        );
        expect(result.current.username).toBe('testuser');
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('returns unauthenticated state when current-user lookup fails with 401', async () => {
        vi.mocked(httpClient).mockRejectedValue(new Error('Not authenticated', { cause: 401 }));

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        expect(result.current.username).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('sets isHost to true when role is HOST', async () => {
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

    it('invalidates the auth query when auth-change is dispatched', async () => {
        vi.mocked(httpClient)
            .mockRejectedValueOnce(new Error('Not authenticated', { cause: 401 }))
            .mockResolvedValueOnce({
                id: '550e8400-e29b-41d4-a716-446655440000',
                username: 'testuser',
                displayName: 'Test User',
                email: 'test@example.com',
                role: 'GUEST',
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
            });

        const { result } = renderHook(() => useAuth(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });

        dispatchAuthChange();

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.username).toBe('testuser');
        expect(vi.mocked(httpClient)).toHaveBeenCalledTimes(2);
    });
});

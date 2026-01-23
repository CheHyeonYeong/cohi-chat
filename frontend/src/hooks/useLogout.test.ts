import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter, createRootRoute, createMemoryHistory } from '@tanstack/react-router';
import { createElement } from 'react';
import { useLogout } from './useLogout';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', async () => {
    const actual = await vi.importActual('@tanstack/react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('useLogout', () => {
    let queryClient: QueryClient;

    const createWrapper = () => {
        return ({ children }: { children: React.ReactNode }) =>
            createElement(QueryClientProvider, { client: queryClient }, children);
    };

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

        localStorage.setItem('auth_token', 'test-token');
        localStorage.setItem('refresh_token', 'test-refresh-token');
        localStorage.setItem('username', 'testuser');

        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('should call logout API with auth token', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        result.current.mutate();

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/members/v1/logout'),
                expect.objectContaining({
                    method: 'DELETE',
                    headers: { Authorization: 'Bearer test-token' },
                })
            );
        });
    });

    it('should clear localStorage on logout', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        result.current.mutate();

        await waitFor(() => {
            expect(localStorage.getItem('auth_token')).toBeNull();
            expect(localStorage.getItem('refresh_token')).toBeNull();
            expect(localStorage.getItem('username')).toBeNull();
        });
    });

    it('should navigate to login page after logout', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        result.current.mutate();

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith({ to: '/app/login' });
        });
    });

    it('should clear localStorage even if API call fails', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        result.current.mutate();

        await waitFor(() => {
            expect(localStorage.getItem('auth_token')).toBeNull();
            expect(localStorage.getItem('refresh_token')).toBeNull();
            expect(localStorage.getItem('username')).toBeNull();
        });
    });

    it('should not call API if no auth token exists', async () => {
        localStorage.removeItem('auth_token');

        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        result.current.mutate();

        await waitFor(() => {
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });
});

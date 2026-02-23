import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useLogout } from './useLogout';
import { logoutApi } from '../api/memberApi';

vi.mock('../api/memberApi', () => ({
    logoutApi: vi.fn(),
}));

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
        vi.mocked(logoutApi).mockResolvedValue(undefined);
    });

    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('should call logout API when auth token exists', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(logoutApi).toHaveBeenCalledTimes(1);
    });

    it('should clear localStorage on logout', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(localStorage.getItem('username')).toBeNull();
    });

    it('should navigate to login page after logout', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login', replace: true });
    });

    it('should clear localStorage even if API call fails', async () => {
        vi.mocked(logoutApi).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(localStorage.getItem('username')).toBeNull();
    });

    it('should not call API if no auth token exists', async () => {
        localStorage.removeItem('auth_token');

        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(logoutApi).not.toHaveBeenCalled();
    });
});

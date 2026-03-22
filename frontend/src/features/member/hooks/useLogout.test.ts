import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { useLogout } from './useLogout';
import { logoutApi } from '../api/memberApi';
import { clearAuthenticatedUser } from '../utils/authStorage';

vi.mock('../api/memberApi', () => ({
    logoutApi: vi.fn(),
}));

vi.mock('../utils/authStorage', () => ({
    clearAuthenticatedUser: vi.fn(),
}));

const mockNavigate = vi.fn();
const mockShowToast = vi.fn();

vi.mock('@tanstack/react-router', async () => {
    const actual = await vi.importActual('@tanstack/react-router');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('~/components/toast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

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

        vi.clearAllMocks();
        vi.mocked(logoutApi).mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('calls logout API', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(logoutApi).toHaveBeenCalledTimes(1);
    });

    it('clears auth state on logout', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(clearAuthenticatedUser).toHaveBeenCalledTimes(1);
    });

    it('navigates to login page after logout', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login', replace: true });
    });

    it('shows toast and preserves auth state when logout API fails', async () => {
        vi.mocked(logoutApi).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(mockShowToast).toHaveBeenCalledWith(
            '로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.',
            'logout-error',
        );
        expect(clearAuthenticatedUser).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});

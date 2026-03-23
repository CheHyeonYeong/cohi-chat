import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useLogout } from './useLogout';
import { logoutApi } from '../api/memberApi';

vi.mock('../api/memberApi', () => ({
    logoutApi: vi.fn(),
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
        return ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );
    };

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

        localStorage.setItem('username', 'testuser');

        vi.clearAllMocks();
        vi.mocked(logoutApi).mockResolvedValue(undefined);
    });

    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('calls logout API', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(logoutApi).toHaveBeenCalledTimes(1);
    });

    it('clears stored username on logout', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(localStorage.getItem('username')).toBeNull();
    });

    it('navigates to login page after logout', async () => {
        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(mockNavigate).toHaveBeenCalledWith({ to: '/login', replace: true });
    });

    it('API 실패 시 토스트를 표시하고 로컬 상태와 네비게이션을 실행하지 않는다', async () => {
        vi.mocked(logoutApi).mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();
        expect(mockShowToast).toHaveBeenCalledWith(
            '로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.',
            'logout-error',
        );
        expect(localStorage.getItem('username')).toBe('testuser'); // 로컬 상태 유지 (서버 세션과 일치)
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('still calls API when username is missing', async () => {
        localStorage.removeItem('username');

        const { result } = renderHook(() => useLogout(), {
            wrapper: createWrapper(),
        });

        await result.current.logout();

        expect(logoutApi).toHaveBeenCalledTimes(1);
    });
});

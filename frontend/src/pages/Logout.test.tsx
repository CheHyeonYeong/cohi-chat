import type { ComponentType, PropsWithChildren, ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => mockNavigate,
    useRouterState: () => ({ location: { pathname: '/logout' } }),
    Link: ({ children, ...props }: PropsWithChildren<Record<string, unknown>>) =>
        <a {...props}>{children}</a>,
    createLink:
        (component: ComponentType<Record<string, unknown>>) =>
            (props: Record<string, unknown>) => {
                const { to, ...rest } = props;
                const Component = component;
                return <Component href={to} {...rest} />;
            },
}));

vi.mock('~/features/member/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('~/features/member/hooks/useLogout', () => ({
    useLogout: () => ({ logout: mockLogout }),
}));

vi.mock('~/features/host', () => ({
    useMyCalendar: () => ({ data: null, isLoading: false }),
}));

import { useAuth } from '~/features/member/hooks/useAuth';
import { Logout } from './Logout';

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: ReactNode }) =>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('Logout', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('로그인 상태에서 "로그아웃중입니다..." 메시지를 표시한다', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
        } as ReturnType<typeof useAuth>);

        render(<Logout />, { wrapper: createWrapper() });

        expect(screen.getByText('로그아웃중입니다...')).toBeInTheDocument();
    });

    it('로그인 상태에서 2초 후 logout()을 호출한다', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: true,
        } as ReturnType<typeof useAuth>);

        render(<Logout />, { wrapper: createWrapper() });

        expect(mockLogout).not.toHaveBeenCalled();
        vi.advanceTimersByTime(2000);
        expect(mockLogout).toHaveBeenCalledOnce();
    });

    it('비로그인 상태에서 마운트 시 홈으로 리다이렉트한다', () => {
        vi.mocked(useAuth).mockReturnValue({
            isAuthenticated: false,
        } as ReturnType<typeof useAuth>);

        render(<Logout />, { wrapper: createWrapper() });

        expect(mockLogout).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/', replace: true });
    });
});

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => navigateMock,
}));

const mockUseAuth = vi.fn();
vi.mock('~/features/member', () => ({
    useAuth: () => mockUseAuth(),
}));

import { AuthGuard } from './AuthGuard';

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

describe('AuthGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('로딩 중일 때 로딩 메시지를 표시한다', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: true,
        });

        render(
            <AuthGuard><div data-testid="protected">보호된 콘텐츠</div></AuthGuard>,
            { wrapper: createWrapper() },
        );
        expect(screen.getByText('확인 중...')).toBeInTheDocument();
        expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });

    it('미인증 사용자는 /login으로 리다이렉트되며 redirect param이 포함된다', async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
        });

        render(
            <AuthGuard><div data-testid="protected">보호된 콘텐츠</div></AuthGuard>,
            { wrapper: createWrapper() },
        );

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: '/login',
                    search: expect.objectContaining({ redirect: expect.any(String) }),
                }),
            );
        });
        expect(screen.queryByTestId('protected')).not.toBeInTheDocument();
    });

    it('인증된 사용자에게 자식 컴포넌트를 렌더링한다', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
        });

        render(
            <AuthGuard><div data-testid="protected">보호된 콘텐츠</div></AuthGuard>,
            { wrapper: createWrapper() },
        );
        expect(screen.getByTestId('protected')).toBeInTheDocument();
        expect(screen.getByText('보호된 콘텐츠')).toBeInTheDocument();
    });
});

import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HostGuard } from './HostGuard';

const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('~/features/member', () => ({
    useAuth: vi.fn(),
}));

import { useAuth } from '~/features/member';

const createQueryClient = () =>
    new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

const renderWithProviders = (ui: ReactElement) => {
    const queryClient = createQueryClient();
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('HostGuard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('로딩 상태', () => {
        it('로딩 중이면 로딩 메시지를 표시한다', () => {
            vi.mocked(useAuth).mockReturnValue({
                isAuthenticated: false,
                data: undefined,
                isLoading: true,
            } as unknown as ReturnType<typeof useAuth>);

            renderWithProviders(
                <HostGuard>
                    <div>Protected Content</div>
                </HostGuard>,
            );

            expect(screen.getByText('확인 중...')).toBeInTheDocument();
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });
    });

    describe('비로그인 상태', () => {
        it('로그인하지 않으면 /login으로 리다이렉트한다', async () => {
            vi.mocked(useAuth).mockReturnValue({
                isAuthenticated: false,
                data: undefined,
                isLoading: false,
            } as unknown as ReturnType<typeof useAuth>);

            renderWithProviders(
                <HostGuard>
                    <div>Protected Content</div>
                </HostGuard>,
            );

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
            });
        });

        it('비로그인 상태에서는 children을 렌더링하지 않는다', () => {
            vi.mocked(useAuth).mockReturnValue({
                isAuthenticated: false,
                data: undefined,
                isLoading: false,
            } as unknown as ReturnType<typeof useAuth>);

            renderWithProviders(
                <HostGuard>
                    <div>Protected Content</div>
                </HostGuard>,
            );

            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });
    });

    describe('호스트가 아닌 로그인 유저', () => {
        it('호스트가 아니면 홈으로 리다이렉트한다', async () => {
            vi.mocked(useAuth).mockReturnValue({
                isAuthenticated: true,
                data: { id: 1, username: 'test', displayName: 'Test', isHost: false },
                isLoading: false,
            } as unknown as ReturnType<typeof useAuth>);

            renderWithProviders(
                <HostGuard>
                    <div>Protected Content</div>
                </HostGuard>,
            );

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
            });
        });
    });

    describe('호스트 로그인 유저', () => {
        it('호스트면 children을 렌더링한다', () => {
            vi.mocked(useAuth).mockReturnValue({
                isAuthenticated: true,
                data: { id: 1, username: 'test', displayName: 'Test', isHost: true },
                isLoading: false,
            } as unknown as ReturnType<typeof useAuth>);

            renderWithProviders(
                <HostGuard>
                    <div>Protected Content</div>
                </HostGuard>,
            );

            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });

        it('호스트면 리다이렉트하지 않는다', () => {
            vi.mocked(useAuth).mockReturnValue({
                isAuthenticated: true,
                data: { id: 1, username: 'test', displayName: 'Test', isHost: true },
                isLoading: false,
            } as unknown as ReturnType<typeof useAuth>);

            renderWithProviders(
                <HostGuard>
                    <div>Protected Content</div>
                </HostGuard>,
            );

            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});

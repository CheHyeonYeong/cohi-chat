import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => navigateMock,
    Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement('a', props, children),
}));

vi.mock('~/features/member/hooks/useUpdateMember', () => ({
    useUpdateMember: () => ({
        mutate: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        error: null,
    }),
}));

const mockUseAuth = vi.fn();
vi.mock('~/features/member', () => ({
    useAuth: () => mockUseAuth(),
    useLogout: () => ({ logout: vi.fn() }),
}));

// SettingsGuarded는 useAuth mock 이후에 import
import SettingsGuarded from './SettingsGuarded';

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('SettingsGuarded', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('로딩 중일 때 로딩 메시지를 표시한다', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: true,
        });

        render(<SettingsGuarded />, { wrapper: createWrapper() });
        expect(screen.getByText('확인 중...')).toBeInTheDocument();
    });

    it('미인증 사용자는 /login으로 리다이렉트된다', async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
        });

        render(<SettingsGuarded />, { wrapper: createWrapper() });

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith({ to: '/login' });
        });
    });

    it('인증된 사용자에게 Settings 컴포넌트를 렌더링한다', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            data: {
                id: 'test-id',
                username: 'testuser',
                displayName: 'Test User',
                email: 'test@example.com',
                role: 'GUEST',
                isHost: false,
            },
            isSuccess: true,
        });

        render(<SettingsGuarded />, { wrapper: createWrapper() });
        expect(screen.getByTestId('settings-title')).toHaveTextContent('설정');
    });
});

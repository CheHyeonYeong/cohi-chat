import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import Settings from './Settings';

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => vi.fn(),
    Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement('a', props, children),
    createLink: (component: React.ComponentType) => component,
}));

vi.mock('~/features/member/hooks/useAuth', () => ({
    useAuth: () => ({
        data: {
            id: 'test-id',
            username: 'testuser',
            displayName: 'Test User',
            email: 'test@example.com',
            role: 'GUEST',
            isHost: false,
        },
        isAuthenticated: true,
        isLoading: false,
        isSuccess: true,
    }),
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

describe('Settings', () => {
    it('설정 타이틀이 렌더링된다', () => {
        render(<Settings />, { wrapper: createWrapper() });
        expect(screen.getByTestId('settings-title')).toHaveTextContent('설정');
    });

    it('프로필 편집 폼이 렌더링된다', () => {
        render(<Settings />, { wrapper: createWrapper() });
        expect(screen.getByTestId('profile-edit-form')).toBeInTheDocument();
    });

    it('비밀번호 변경 폼이 렌더링된다', () => {
        render(<Settings />, { wrapper: createWrapper() });
        expect(screen.getByTestId('password-change-form')).toBeInTheDocument();
    });
});

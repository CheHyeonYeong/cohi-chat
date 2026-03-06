import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => navigateMock,
    useSearch: () => ({ page: 1, pageSize: 10 }),
    Link: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) =>
        React.createElement('a', props, children),
}));

const mockUseAuth = vi.fn();
vi.mock('~/features/member', () => ({
    useAuth: () => mockUseAuth(),
}));

vi.mock('./MyBookings', () => ({
    default: () => React.createElement('div', { 'data-testid': 'my-bookings-page' }, '내 예약 목록'),
}));

import MyBookingsGuarded from './MyBookingsGuarded';

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

describe('MyBookingsGuarded', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('로딩 중일 때 로딩 메시지를 표시한다', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: true,
        });

        render(<MyBookingsGuarded />, { wrapper: createWrapper() });
        expect(screen.getByText('확인 중...')).toBeInTheDocument();
    });

    it('미인증 사용자는 /login으로 리다이렉트된다', async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            isLoading: false,
        });

        render(<MyBookingsGuarded />, { wrapper: createWrapper() });

        await waitFor(() => {
            expect(navigateMock).toHaveBeenCalledWith({ to: '/login' });
        });
    });

    it('인증된 사용자에게 MyBookings 컴포넌트를 렌더링한다', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
        });

        render(<MyBookingsGuarded />, { wrapper: createWrapper() });
        expect(screen.getByTestId('my-bookings-page')).toBeInTheDocument();
    });
});

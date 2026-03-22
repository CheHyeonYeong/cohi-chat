import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@tanstack/react-router', () => ({
    Link: ({
        children,
        to,
        params,
        ...props
    }: React.PropsWithChildren<{ to: string; params?: Record<string, string> } & Record<string, unknown>>) => {
        const href = params
            ? Object.entries(params).reduce((acc, [key, val]) => acc.replace(`$${key}`, val), to)
            : to;
        return React.createElement('a', { href, ...props }, children);
    },
}));

const mockLogout = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('~/features/member', () => ({
    useAuth: () => mockUseAuth(),
    useLogout: () => ({ logout: mockLogout }),
}));

const mockUseMyCalendar = vi.fn();
vi.mock('~/features/host', () => ({
    useMyCalendar: (...args: unknown[]) => mockUseMyCalendar(...args),
}));

import { ProfileDropdown } from './ProfileDropdown';

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

const nonHostUser = {
    displayName: 'TestUser',
    username: 'testuser',
    isHost: false,
};

const hostUser = {
    displayName: 'HostUser',
    username: 'hostuser123',
    isHost: true,
};

beforeEach(() => {
    vi.clearAllMocks();
    mockUseMyCalendar.mockReturnValue({ data: null, isLoading: false });
});

describe('ProfileDropdown', () => {
    it('renders avatar for authenticated user', () => {
        mockUseAuth.mockReturnValue({ data: nonHostUser });

        render(<ProfileDropdown />, { wrapper: createWrapper() });

        expect(screen.getByTestId('profile-avatar')).toBeInTheDocument();
    });

    it('opens the dropdown menu when avatar is clicked', async () => {
        mockUseAuth.mockReturnValue({ data: nonHostUser });
        const user = userEvent.setup();

        render(<ProfileDropdown />, { wrapper: createWrapper() });

        await user.click(screen.getByTestId('profile-avatar'));

        expect(screen.getByTestId('profile-dropdown-menu')).toBeInTheDocument();
    });

    it('shows guest user menu items including logout', async () => {
        mockUseAuth.mockReturnValue({ data: nonHostUser });
        const user = userEvent.setup();

        render(<ProfileDropdown />, { wrapper: createWrapper() });
        await user.click(screen.getByTestId('profile-avatar'));

        expect(screen.getByTestId('menu-item-my-bookings')).toHaveTextContent('내 예약 목록');
        expect(screen.getByTestId('menu-item-settings')).toHaveTextContent('회원정보 변경');
        expect(screen.getByTestId('menu-item-host-register')).toHaveTextContent('호스트 등록하기');
        expect(screen.getByTestId('menu-item-logout')).toHaveTextContent('로그아웃');

        expect(screen.queryByTestId('menu-item-host-profile-preview')).not.toBeInTheDocument();
        expect(screen.queryByTestId('menu-item-host-timeslots')).not.toBeInTheDocument();
        expect(screen.queryByTestId('menu-item-host-calendar')).not.toBeInTheDocument();
    });

    it('shows host calendar menu items when calendar exists', async () => {
        mockUseAuth.mockReturnValue({ data: hostUser });
        mockUseMyCalendar.mockReturnValue({ data: { googleCalendarId: 'test@gmail.com' }, isLoading: false });
        const user = userEvent.setup();

        render(<ProfileDropdown />, { wrapper: createWrapper() });
        await user.click(screen.getByTestId('profile-avatar'));

        expect(screen.getByTestId('menu-item-host-profile-preview')).toHaveTextContent('내 프로필 미리보기');
        expect(screen.getByTestId('menu-item-host-timeslots')).toHaveTextContent('시간대 설정');
        expect(screen.getByTestId('menu-item-host-calendar')).toHaveTextContent('호스트 설정');

        expect(screen.queryByTestId('menu-item-host-register')).not.toBeInTheDocument();
    });

    it('calls logout when logout menu item is clicked', async () => {
        mockUseAuth.mockReturnValue({ data: nonHostUser });
        const user = userEvent.setup();

        render(<ProfileDropdown />, { wrapper: createWrapper() });
        await user.click(screen.getByTestId('profile-avatar'));
        await user.click(screen.getByTestId('menu-item-logout'));

        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('renders expected navigation links', async () => {
        mockUseAuth.mockReturnValue({ data: hostUser });
        mockUseMyCalendar.mockReturnValue({ data: { googleCalendarId: 'test@gmail.com' }, isLoading: false });
        const user = userEvent.setup();

        render(<ProfileDropdown />, { wrapper: createWrapper() });
        await user.click(screen.getByTestId('profile-avatar'));

        expect(screen.getByTestId('menu-item-my-bookings')).toHaveAttribute('href', '/booking/my-bookings');
        expect(screen.getByTestId('menu-item-settings')).toHaveAttribute('href', '/member/settings');
        expect(screen.getByTestId('menu-item-host-profile-preview')).toHaveAttribute('href', `/host/${hostUser.username}`);
        expect(screen.getByTestId('menu-item-host-timeslots')).toHaveAttribute('href', '/host/timeslots');
        expect(screen.getByTestId('menu-item-host-calendar')).toHaveAttribute('href', '/host/settings');
    });
});

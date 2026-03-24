import type { PropsWithChildren, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@tanstack/react-router', () => ({
    Link: ({ children, to, ...props }: PropsWithChildren<Record<string, unknown>>) =>
        <a href={to as string} {...props}>{children}</a>,
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
    return ({ children }: { children: ReactNode }) =>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

const nonHostUser = {
    displayName: 'TestUser',
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
    it('아바타가 렌더링된다', () => {
        mockUseAuth.mockReturnValue({ data: nonHostUser });

        render(<ProfileDropdown />, { wrapper: createWrapper() });

        expect(screen.getByTestId('profile-avatar')).toBeInTheDocument();
    });

    it('클릭하면 드롭다운이 열린다', async () => {
        mockUseAuth.mockReturnValue({ data: nonHostUser });
        const user = userEvent.setup();

        render(<ProfileDropdown />, { wrapper: createWrapper() });

        await user.click(screen.getByTestId('profile-avatar'));

        expect(screen.getByTestId('profile-dropdown-menu')).toBeInTheDocument();
    });

    it('비호스트: "내 예약 목록", "회원정보 변경", "로그아웃" 메뉴가 표시된다', async () => {
        mockUseAuth.mockReturnValue({ data: nonHostUser });
        const user = userEvent.setup();

        render(<ProfileDropdown />, { wrapper: createWrapper() });
        await user.click(screen.getByTestId('profile-avatar'));

        expect(screen.getByTestId('menu-item-my-bookings')).toHaveTextContent('내 예약 목록');
        expect(screen.getByTestId('menu-item-settings')).toHaveTextContent('회원정보 변경');
        // 호스트 등록 임시 비활성화 (#479)
        // expect(screen.getByTestId('menu-item-host-register')).toHaveTextContent('호스트 등록하기');
        expect(screen.getByTestId('menu-item-logout')).toHaveTextContent('로그아웃');

        expect(screen.queryByTestId('menu-item-host-register')).not.toBeInTheDocument();
        expect(screen.queryByTestId('menu-item-host-profile-preview')).not.toBeInTheDocument();
        expect(screen.queryByTestId('menu-item-host-timeslots')).not.toBeInTheDocument();
        expect(screen.queryByTestId('menu-item-host-calendar')).not.toBeInTheDocument();
    });

    it('호스트(캘린더 있음): "내 프로필 미리보기", "시간대 설정", "호스트 설정" 메뉴가 표시된다, "호스트 등록하기"는 없다', async () => {
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

    it('로그아웃 클릭 시 logout 함수가 호출된다', async () => {
        mockUseAuth.mockReturnValue({ data: nonHostUser });
        const user = userEvent.setup();

        render(<ProfileDropdown />, { wrapper: createWrapper() });
        await user.click(screen.getByTestId('profile-avatar'));
        await user.click(screen.getByTestId('menu-item-logout'));

        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('메뉴 항목 링크 href 확인', async () => {
        mockUseAuth.mockReturnValue({ data: hostUser });
        mockUseMyCalendar.mockReturnValue({ data: { googleCalendarId: 'test@gmail.com' }, isLoading: false });
        const user = userEvent.setup();

        render(<ProfileDropdown />, { wrapper: createWrapper() });
        await user.click(screen.getByTestId('profile-avatar'));

        expect(screen.getByTestId('menu-item-my-bookings')).toHaveAttribute('href', '/booking/my-bookings');
        expect(screen.getByTestId('menu-item-settings')).toHaveAttribute('href', '/member/settings');
        expect(screen.getByTestId('menu-item-host-profile-preview')).toHaveAttribute('href', '/host/$hostId');
        expect(screen.getByTestId('menu-item-host-timeslots')).toHaveAttribute('href', '/host/timeslots');
        expect(screen.getByTestId('menu-item-host-calendar')).toHaveAttribute('href', '/host/settings');
    });
});

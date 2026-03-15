import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Link } from '@tanstack/react-router';
import { Avatar } from '~/components/Avatar';
import { useAuth, useLogout } from '~/features/member';
import { useMyCalendar } from '~/features/host';

export function ProfileDropdown() {
    const { data: user } = useAuth();
    const { logout } = useLogout();
    const isHost = user?.isHost ?? false;
    const { data: myCalendar } = useMyCalendar(isHost);
    const hasCalendar = isHost && !!myCalendar;

    if (!user) return null;

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    data-testid="profile-avatar"
                    className="rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--cohi-primary)]/50"
                >
                    <Avatar
                        displayName={user.displayName}
                        size="sm"
                    />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    data-testid="profile-dropdown-menu"
                    align="end"
                    sideOffset={8}
                    className="min-w-[180px] bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-in fade-in-0 zoom-in-95"
                >
                    <DropdownMenuItem
                        data-testid="menu-item-my-bookings"
                        to="/booking/my-bookings"
                    >
                        내 예약 목록
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        data-testid="menu-item-settings"
                        to="/member/settings"
                    >
                        회원정보 변경
                    </DropdownMenuItem>

                    <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />

                    {hasCalendar ? (
                        <>
                            <DropdownMenuItem
                                data-testid="menu-item-host-profile-preview"
                                to="/host/$hostId"
                                params={{ hostId: user.username }}
                            >
                                내 프로필 미리보기
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                data-testid="menu-item-host-timeslots"
                                to="/host/timeslots"
                            >
                                시간대 설정
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                data-testid="menu-item-host-calendar"
                                to="/host/settings"
                            >
                                호스트 설정
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <DropdownMenuItem
                            data-testid="menu-item-host-register"
                            to="/host/register"
                        >
                            호스트 등록하기
                        </DropdownMenuItem>
                    )}

                    <DropdownMenu.Separator className="h-px bg-gray-100 my-1" />

                    <DropdownMenu.Item
                        data-testid="menu-item-logout"
                        onSelect={logout}
                        className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
                    >
                        로그아웃
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

function DropdownMenuItem({ to, params, children, ...props }: { to: string; params?: Record<string, string>; children: React.ReactNode; 'data-testid': string }) {
    return (
        <DropdownMenu.Item asChild className="outline-none">
            <Link
                to={to}
                params={params}
                className="block px-4 py-2 text-sm text-[var(--cohi-text-dark)] hover:bg-[var(--cohi-bg-warm)] cursor-pointer"
                {...props}
            >
                {children}
            </Link>
        </DropdownMenu.Item>
    );
}

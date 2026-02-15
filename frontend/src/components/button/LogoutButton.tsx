import React from 'react';
import Button from './Button';
import { useLogout } from '~/features/member';

export function LogoutButton() {
    const { logout } = useLogout();      // hook 호출

    return (
        <Button
            variant="outline"
            className="px-4 py-2 rounded-lg font-medium"
            onClick={logout}
        >
        로그아웃
        </Button>
    );
}

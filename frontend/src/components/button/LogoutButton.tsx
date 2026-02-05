import React from 'react';
import Button from './Button';
import { useLogout } from '~/hooks/useLogout';

export function LogoutButton() {
    const { logout } = useLogout();      // hook 호출

    return (
        <Button
            variant="secondary"
            onClick={logout}
        >
        로그아웃
        </Button>
    );
}

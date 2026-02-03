import React from 'react';
import Button from './Button';
import { useLogout } from '~/features/member';

/**
 * 로그아웃 버튼 컴포넌트입니다.
 *
 * useLogout 훅을 사용하여 클릭 시 로그아웃을 수행합니다.
 */
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

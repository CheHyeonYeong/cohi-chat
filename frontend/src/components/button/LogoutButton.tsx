import { Button } from './Button';
import { useLogout } from '~/features/member';

export const LogoutButton = () => {
    const { logout } = useLogout();      // hook 호출

    return (
        <Button
            variant="outline"
            onClick={logout}
        >
        로그아웃
        </Button>
    );
};

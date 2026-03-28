import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth, useLogout } from '~/features/member';

export const Logout = () => {
    const { isAuthenticated } = useAuth();
    const { logout } = useLogout();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            const timer = setTimeout(() => {
                logout();
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            navigate({ to: '/', replace: true });
        }
    }, [isAuthenticated, logout, navigate]);

    if (!isAuthenticated) return null;

    return (
        <div className="flex min-h-screen items-center justify-center">
            <p className="text-lg text-cohi-text-dark">로그아웃중입니다...</p>
        </div>
    );
};

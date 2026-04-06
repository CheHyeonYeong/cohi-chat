import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useAuth } from '~/features/member';

interface AuthGuardProps {
    children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            const currentPath = location.pathname + location.search;
            navigate({ to: '/login', search: { redirect: currentPath } });
        }
    }, [isAuthenticated, isLoading, navigate, location.pathname, location.search]);

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-cohi-bg-light flex items-center justify-center">
                <p className="text-gray-500">확인 중...</p>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return <>{children}</>;
};

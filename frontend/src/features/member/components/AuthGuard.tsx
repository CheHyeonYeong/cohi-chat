import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '~/features/member';

interface AuthGuardProps {
    children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const redirected = useRef(false);

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated && !redirected.current) {
            redirected.current = true;
            const currentPath = window.location.pathname + window.location.search;
            navigate({ to: '/login', search: { redirect: currentPath } });
        }
    }, [isAuthenticated, isLoading, navigate]);

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

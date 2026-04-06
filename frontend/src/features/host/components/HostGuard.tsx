import type { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useAuth } from '~/features/member';

interface HostGuardProps {
    children: ReactNode;
}

export const HostGuard = ({ children }: HostGuardProps) => {
    const { data: user, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const redirected = useRef(false);

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated || !user) {
            if (!redirected.current) {
                redirected.current = true;
                const currentPath = window.location.pathname + window.location.search;
                navigate({ to: '/login', search: { redirect: currentPath } });
            }
            return;
        }
        if (!user.isHost) {
            navigate({ to: '/' });
        }
    }, [isAuthenticated, user, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-cohi-bg-light flex items-center justify-center">
                <p className="text-gray-500">확인 중...</p>
            </div>
        );
    }

    if (!isAuthenticated || !user || !user.isHost) {
        return null;
    }

    return <>{children}</>;
};

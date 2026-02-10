import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '~/features/member';

interface HostGuardProps {
    children: React.ReactNode;
}

export default function HostGuard({ children }: HostGuardProps) {
    const { data: user, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            navigate({ to: '/app/login' });
            return;
        }
        if (user && !user.isHost) {
            navigate({ to: '/app' });
        }
    }, [isAuthenticated, user, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohe-bg-light)] flex items-center justify-center">
                <p className="text-gray-500">확인 중...</p>
            </div>
        );
    }

    if (!isAuthenticated || !user || !user.isHost) {
        return null;
    }

    return <>{children}</>;
}

import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuth } from '~/features/member';
import HostRegister from './HostRegister';

export default function HostRegisterGuarded() {
    const { isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            navigate({ to: '/app/login' });
        }
    }, [isAuthenticated, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohe-bg-light)] flex items-center justify-center">
                <p className="text-gray-500">확인 중...</p>
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return <HostRegister />;
}

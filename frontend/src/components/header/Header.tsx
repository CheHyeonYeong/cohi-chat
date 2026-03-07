import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import { cn } from '~/libs/cn';
import { useAuth } from '~/features/member';
import { LogoutButton } from '~/components/button/LogoutButton';
import LinkButton from '~/components/button/LinkButton';

interface HeaderProps {
    center?: ReactNode;
    right?: ReactNode;
    className?: string;
    showAuth?: boolean;
}

function AuthControls() {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) return <LogoutButton />;
    return <LinkButton variant="outline" to="/login">로그인</LinkButton>;
}

export default function Header({ center, right, className, showAuth }: HeaderProps) {
    return (
        <header className={cn('w-full px-6 py-4 flex justify-between items-center bg-[var(--cohi-bg-warm)]/80 backdrop-blur-sm', className)}>
            <Link to='/' className="flex items-center gap-2">
                <CoffeeCupIcon className="w-8 h-8 text-[var(--cohi-primary)]" />
                <span className="text-xl font-bold text-[var(--cohi-text-dark)]">cohiChat</span>
            </Link>
            {center}
            {(right || showAuth) && (
                <div className="flex items-center gap-3">
                    {right}
                    {showAuth && <AuthControls />}
                </div>
            )}
        </header>
    );
}

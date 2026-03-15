import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { CoffeeCupIcon } from '~/components/icons/CoffeeCupIcon';
import { LinkButton } from '~/components/button/LinkButton';
import { cn } from '~/libs/cn';
import { useAuth } from '~/features/member';
import { ProfileDropdown } from './ProfileDropdown';

interface HeaderProps {
    center?: ReactNode;
    className?: string;
}

export function Header({ center, className }: HeaderProps) {
    const { isAuthenticated } = useAuth();

    return (
        <header className={cn('w-full h-16 px-6 flex justify-between items-center bg-[var(--cohi-bg-warm)]/80 backdrop-blur-sm', className)}>
            <Link to='/' className="flex items-center gap-2">
                <CoffeeCupIcon className="w-8 h-8 text-[var(--cohi-primary)]" />
                <span className="text-xl font-bold text-[var(--cohi-text-dark)]">cohiChat</span>
            </Link>
            {center}
            {isAuthenticated ? (
                <ProfileDropdown />
            ) : (
                <LinkButton variant="outline" to="/login">
                    로그인
                </LinkButton>
            )}
        </header>
    );
}

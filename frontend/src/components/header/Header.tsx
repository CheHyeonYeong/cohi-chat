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

export const Header = ({ center, className }: HeaderProps) => {
    const { isAuthenticated, isSuccess } = useAuth();

    return (
        <header className={cn('w-full h-16 px-6 flex justify-between items-center bg-cohi-bg-light backdrop-blur-xs', className)}>
            <Link to='/' className="flex items-center gap-2">
                <CoffeeCupIcon className="w-8 h-8 text-cohi-primary" />
                <span className="text-xl font-bold text-cohi-text-dark">cohiChat</span>
            </Link>
            {center}
            {isAuthenticated && isSuccess ? (
                <ProfileDropdown />
            ) : (
                <LinkButton variant="outline" to="/login">
                    로그인
                </LinkButton>
            )}
        </header>
    );
};

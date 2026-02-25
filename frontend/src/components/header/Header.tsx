import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import { cn } from '~/libs/cn';

interface HeaderProps {
    center?: ReactNode;
    right?: ReactNode;
    className?: string;
}

export default function Header({ center, right, className }: HeaderProps) {
    return (
        <header className={cn('w-full px-6 py-4 flex justify-between items-center bg-[var(--cohe-bg-warm)]/80 backdrop-blur-sm', className)}>
            <Link to='/' className="flex items-center gap-2">
                <CoffeeCupIcon className="w-8 h-8 text-[var(--cohe-primary)]" />
                <span className="text-xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
            </Link>
            {center}
            {right}
        </header>
    );
}

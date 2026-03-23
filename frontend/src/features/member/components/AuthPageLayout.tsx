import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { CoffeeCupIcon } from '~/components/icons/CoffeeCupIcon';
import { Card } from '~/components/card';
import { cn } from '~/libs/cn';
import { useDocumentTitle } from '~/hooks/useDocumentTitle';

interface AuthPageLayoutProps {
    title: string;
    className?: string;
    children: ReactNode;
}

export const AuthPageLayout = ({ title, className, children }: AuthPageLayoutProps) => {
    useDocumentTitle(title);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-cohi-bg-light">
            <Link to="/" className="flex items-center gap-2 mb-8">
                <CoffeeCupIcon className="w-10 h-10 text-cohi-primary" />
                <span className="text-2xl font-bold text-cohi-text-dark">cohiChat</span>
            </Link>

            <Card variant="prominent" size="lg" className={cn('w-full max-w-sm', className)} title={title}>
                {children}
            </Card>
        </div>
    );
};

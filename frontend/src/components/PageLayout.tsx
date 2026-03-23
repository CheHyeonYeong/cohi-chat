import type { ReactNode } from 'react';
import { Header } from '~/components/header';
import { cn } from '~/libs/cn';
import { useDocumentTitle } from '~/hooks/useDocumentTitle';

const MAX_WIDTH_CLASSES: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
};

interface PageLayoutProps {
    title?: string;
    headerCenter?: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
    children: ReactNode;
    className?: string;
}

export const PageLayout = ({ title, headerCenter, maxWidth = '6xl', children, className }: PageLayoutProps) => {
    useDocumentTitle(title);

    return (
        <div className="w-full min-h-screen bg-cohi-bg-light">
            <Header center={headerCenter} />
            <main className={cn('w-full px-6 py-8', className)}>
                <div className={cn('mx-auto', MAX_WIDTH_CLASSES[maxWidth])}>
                    {title && (
                        <h1
                            className="text-2xl font-bold text-cohi-text-dark mb-6"
                            data-testid="page-title"
                        >
                            {title}
                        </h1>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
};

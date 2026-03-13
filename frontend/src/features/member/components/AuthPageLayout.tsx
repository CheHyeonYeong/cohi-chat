import { Link } from '@tanstack/react-router';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';

interface AuthPageLayoutProps {
    title: string;
    children: React.ReactNode;
}

export function AuthPageLayout({ title, children }: AuthPageLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--cohi-bg-warm)]">
            <Link to="/" className="flex items-center gap-2 mb-8">
                <CoffeeCupIcon className="w-10 h-10 text-[var(--cohi-primary)]" />
                <span className="text-2xl font-bold text-[var(--cohi-text-dark)]">cohiChat</span>
            </Link>

            <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-center text-[var(--cohi-text-dark)] mb-6">
                    {title}
                </h2>
                {children}
            </div>
        </div>
    );
}

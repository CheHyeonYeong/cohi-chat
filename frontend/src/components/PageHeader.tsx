import { Link } from '@tanstack/react-router';
import CoffeeCupIcon from '~/components/icons/CoffeeCupIcon';
import { LogoutButton } from '~/components/button/LogoutButton';
import { useAuth } from '~/features/member';

interface PageHeaderProps {
    right?: React.ReactNode;
}

export default function PageHeader({ right }: PageHeaderProps) {
    const { isAuthenticated } = useAuth();

    return (
        <header className="w-full px-6 py-4 flex justify-between items-center bg-[var(--cohe-bg-warm)]/80 backdrop-blur-sm">
            <Link to="/" className="flex items-center gap-2">
                <CoffeeCupIcon className="w-8 h-8 text-[var(--cohe-primary)]" />
                <span className="text-xl font-bold text-[var(--cohe-text-dark)]">coheChat</span>
            </Link>
            <div className="flex items-center gap-3">
                {right}
                {isAuthenticated && <LogoutButton />}
            </div>
        </header>
    );
}

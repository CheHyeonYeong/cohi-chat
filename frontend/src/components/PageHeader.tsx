import type { ReactNode } from 'react';
import { Header } from '~/components/header';
import { LogoutButton } from '~/components/button/LogoutButton';
import { useAuth } from '~/features/member';

interface PageHeaderProps {
    right?: ReactNode;
}

export default function PageHeader({ right }: PageHeaderProps) {
    const { isAuthenticated } = useAuth();

    return (
        <Header right={
            <div className="flex items-center gap-3">
                {right}
                {isAuthenticated && <LogoutButton />}
            </div>
        } />
    );
}

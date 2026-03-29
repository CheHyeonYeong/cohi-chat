import { cn } from '~/libs/cn';
import { Card } from '~/components/card';
import { Avatar } from '~/components/Avatar';
import type { HostResponseDTO } from '../types';

interface HostProfileCardProps {
    host: HostResponseDTO;
    className?: string;
}

export const HostProfileCard = ({ host, className }: HostProfileCardProps) => <Card
    variant="elevated"
    size="lg"
    data-testid="host-profile-card"
    className={cn('flex flex-col items-center text-center', className)}
>
    <Avatar
        displayName={host.displayName}
        profileImageUrl={host.profileImageUrl}
        size="xl"
    />

    <h1
        data-testid="host-profile-name"
        className="mt-4 text-2xl font-bold text-cohi-text-dark"
    >
        {host.displayName}
    </h1>

    {host.job && (
        <p
            data-testid="host-profile-job"
            className="mt-1 text-cohi-secondary"
        >
            {host.job}
        </p>
    )}

    {host.chatCount > 0 && (
        <span
            data-testid="host-profile-chat-count"
            className="mt-3 inline-flex items-center px-3 py-1 bg-cohi-primary/10 text-cohi-primary rounded-full text-sm font-medium"
        >
                    커피챗 {host.chatCount}회
        </span>
    )}
</Card>;

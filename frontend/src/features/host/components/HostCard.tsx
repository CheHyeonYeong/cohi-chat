import { Link } from '@tanstack/react-router';
import { Card } from '~/components/card';
import { Avatar } from '~/components/Avatar';

interface HostCardProps {
    displayName: string;
    username: string;
    job?: string;
    chatCount: number;
    profileImageUrl?: string;
}

export const HostCard = ({ displayName, username, job, chatCount, profileImageUrl }: HostCardProps) => <Card
    asChild
    variant="elevated"
    size="sm"
    className="px-6 hover:shadow-lg transition-shadow cursor-pointer"
>
    <Link
        to="/host/$hostId"
        params={{ hostId: username }}
        data-testid={`host-card-${username}`}
    >
        <Avatar displayName={displayName} profileImageUrl={profileImageUrl} size="md" />
        <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-cohi-text-dark truncate">{displayName}</span>
            <span className="text-sm text-gray-500 truncate">{job ?? '호스트'}</span>
        </div>
        {chatCount > 0 && (
            <span className="flex-shrink-0 px-2.5 py-1 bg-cohi-primary/10 text-cohi-primary rounded-full text-xs font-medium">
                {chatCount}회
            </span>
        )}
    </Link>
</Card>;

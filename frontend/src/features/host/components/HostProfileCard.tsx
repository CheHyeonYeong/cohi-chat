import { cn } from '~/libs/cn';
import type { HostResponseDTO } from '~/features/member';

interface HostProfileCardProps {
    host: HostResponseDTO;
    className?: string;
}

export default function HostProfileCard({ host, className }: HostProfileCardProps) {
    return (
        <div
            data-testid="host-profile-card"
            className={cn('bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center', className)}
        >
            <div
                data-testid="host-profile-avatar"
                className="w-20 h-20 rounded-full bg-[var(--cohe-bg-warm)] flex items-center justify-center overflow-hidden"
            >
                {host.profileImageUrl ? (
                    <img
                        src={host.profileImageUrl}
                        alt={host.displayName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-3xl font-bold text-[var(--cohe-primary)]">
                        {host.displayName.charAt(0)}
                    </span>
                )}
            </div>

            <h1
                data-testid="host-profile-name"
                className="mt-4 text-2xl font-bold text-[var(--cohe-text-dark)]"
            >
                {host.displayName}
            </h1>

            {host.job && (
                <p
                    data-testid="host-profile-job"
                    className="mt-1 text-[var(--cohe-secondary)]"
                >
                    {host.job}
                </p>
            )}

            {host.chatCount > 0 && (
                <span
                    data-testid="host-profile-chat-count"
                    className="mt-3 inline-flex items-center px-3 py-1 bg-[var(--cohe-primary)]/10 text-[var(--cohe-primary)] rounded-full text-sm font-medium"
                >
                    커피챗 {host.chatCount}회
                </span>
            )}
        </div>
    );
}

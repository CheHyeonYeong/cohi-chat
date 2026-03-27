import { cn } from '~/libs/cn';

const SIZE_CLASSES = {
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
} as const;

const INITIAL_TEXT_SIZES = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-3xl',
} as const;

interface AvatarProps {
    displayName: string;
    profileImageUrl?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const Avatar = ({ displayName, profileImageUrl, size = 'md', className }: AvatarProps) => <div
    data-testid="avatar"
    className={cn(
        'rounded-full bg-cohi-bg-warm flex items-center justify-center overflow-hidden flex-shrink-0',
        SIZE_CLASSES[size],
        className,
    )}
>
    {profileImageUrl ? (
        <img src={profileImageUrl} alt={displayName} className="w-full h-full object-cover" />
    ) : (
        <span className={cn('font-semibold text-cohi-primary', INITIAL_TEXT_SIZES[size])}>
            {displayName.charAt(0)}
        </span>
    )}
</div>;

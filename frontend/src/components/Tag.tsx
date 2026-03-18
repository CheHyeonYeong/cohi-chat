import { cn } from '~/libs/cn';

interface TagProps {
    children: React.ReactNode;
    variant?: 'filled' | 'outlined' | 'borderless';
    color?: 'primary' | 'secondary' | 'default' | 'guest' | 'host';
    size?: 'sm' | 'md';
    title?: string;
    className?: string;
}

const variantColorStyles: Record<string, string> = {
    // filled: Ant Design default 스타일 — 따뜻한 배경 + 1px 보더
    'filled-primary':
        'bg-[var(--cohi-bg-warm)] border border-[var(--cohi-primary)]/20 text-[var(--cohi-primary-dark)]',
    'filled-secondary':
        'bg-[var(--cohi-secondary)]/8 border border-[var(--cohi-secondary)]/20 text-[var(--cohi-secondary)]',
    'filled-default': 'bg-gray-50 border border-gray-200 text-[var(--cohi-text-dark)]',
    // outlined: 보더만, 배경 없음
    'outlined-primary': 'border border-[var(--cohi-primary)]/40 text-[var(--cohi-primary)]',
    'outlined-secondary': 'border border-[var(--cohi-secondary)]/40 text-[var(--cohi-secondary)]',
    'outlined-default': 'border border-gray-300 text-[var(--cohi-text-dark)]',
    // borderless: 텍스트만
    'borderless-primary': 'text-[var(--cohi-primary)]',
    'borderless-secondary': 'text-[var(--cohi-secondary)]',
    'borderless-default': 'text-[var(--cohi-text-dark)]',
    // guest/host 역할 전용 색상
    'filled-guest':
        'bg-[var(--cohi-role-guest-bg)] border border-[var(--cohi-role-guest)]/20 text-[var(--cohi-role-guest)]',
    'filled-host':
        'bg-[var(--cohi-role-host-bg)] border border-[var(--cohi-role-host)]/20 text-[var(--cohi-role-host)]',
    'outlined-guest': 'border border-[var(--cohi-role-guest)]/40 text-[var(--cohi-role-guest)]',
    'outlined-host': 'border border-[var(--cohi-role-host)]/40 text-[var(--cohi-role-host)]',
    'borderless-guest': 'text-[var(--cohi-role-guest)]',
    'borderless-host': 'text-[var(--cohi-role-host)]',
};

const sizeStyles: Record<string, string> = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
};

export function Tag({
    children,
    variant = 'filled',
    color = 'primary',
    size = 'md',
    title,
    className,
}: TagProps) {
    return (
        <span
            title={title}
            className={cn(
                'inline-flex items-center rounded-md font-medium',
                variantColorStyles[`${variant}-${color}`],
                sizeStyles[size],
                className,
            )}
        >
            {children}
        </span>
    );
}

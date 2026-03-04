import { cn } from '~/libs/cn';

interface TagProps {
    children: React.ReactNode;
    variant?: 'filled' | 'outlined' | 'borderless';
    color?: 'primary' | 'secondary' | 'default';
    size?: 'sm' | 'md';
    className?: string;
}

const variantColorStyles: Record<string, string> = {
    // filled: Ant Design default 스타일 — 따뜻한 배경 + 1px 보더
    'filled-primary':
        'bg-[var(--cohe-bg-warm)] border border-[var(--cohe-primary)]/20 text-[var(--cohe-primary-dark)]',
    'filled-secondary':
        'bg-[var(--cohe-secondary)]/8 border border-[var(--cohe-secondary)]/20 text-[var(--cohe-secondary)]',
    'filled-default': 'bg-gray-50 border border-gray-200 text-[var(--cohe-text-dark)]',
    // outlined: 보더만, 배경 없음
    'outlined-primary': 'border border-[var(--cohe-primary)]/40 text-[var(--cohe-primary)]',
    'outlined-secondary': 'border border-[var(--cohe-secondary)]/40 text-[var(--cohe-secondary)]',
    'outlined-default': 'border border-gray-300 text-[var(--cohe-text-dark)]',
    // borderless: 텍스트만
    'borderless-primary': 'text-[var(--cohe-primary)]',
    'borderless-secondary': 'text-[var(--cohe-secondary)]',
    'borderless-default': 'text-[var(--cohe-text-dark)]',
};

const sizeStyles: Record<string, string> = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs',
};

export default function Tag({
    children,
    variant = 'filled',
    color = 'primary',
    size = 'md',
    className,
}: TagProps) {
    return (
        <span
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

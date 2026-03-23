import type { ReactNode } from 'react';
import { cn } from '~/libs/cn';

interface TagProps {
    children: ReactNode;
    variant?: 'filled' | 'outlined' | 'borderless';
    color?: 'primary' | 'secondary' | 'default' | 'guest' | 'host';
    size?: 'sm' | 'md';
    title?: string;
    className?: string;
}

const variantColorStyles: Record<string, string> = {
    // filled: Ant Design default 스타일 — 따뜻한 배경 + 1px 보더
    'filled-primary':
        'bg-cohi-bg-warm border border-cohi-primary/20 text-cohi-primary-dark',
    'filled-secondary':
        'bg-cohi-secondary/8 border border-cohi-secondary/20 text-cohi-secondary',
    'filled-default': 'bg-gray-50 border border-gray-200 text-cohi-text-dark',
    // outlined: 보더만, 배경 없음
    'outlined-primary': 'border border-cohi-primary/40 text-cohi-primary',
    'outlined-secondary': 'border border-cohi-secondary/40 text-cohi-secondary',
    'outlined-default': 'border border-gray-300 text-cohi-text-dark',
    // borderless: 텍스트만
    'borderless-primary': 'text-cohi-primary',
    'borderless-secondary': 'text-cohi-secondary',
    'borderless-default': 'text-cohi-text-dark',
    // guest/host 역할 전용 색상
    'filled-guest':
        'bg-cohi-role-guest-bg border border-cohi-role-guest/20 text-cohi-role-guest',
    'filled-host':
        'bg-cohi-role-host-bg border border-cohi-role-host/20 text-cohi-role-host',
    'outlined-guest': 'border border-cohi-role-guest/40 text-cohi-role-guest',
    'outlined-host': 'border border-cohi-role-host/40 text-cohi-role-host',
    'borderless-guest': 'text-cohi-role-guest',
    'borderless-host': 'text-cohi-role-host',
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

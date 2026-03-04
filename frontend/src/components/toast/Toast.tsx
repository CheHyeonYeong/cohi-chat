import { cn } from '~/libs/cn';

interface ToastProps {
    visible: boolean;
    description: string;
}

export function Toast({ visible, description }: ToastProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            data-testid="toast-root"
            className={cn(
                'rounded-md bg-[var(--cohi-primary)] px-4 py-2 text-sm font-medium text-[var(--cohi-text-light)] shadow-lg',
                'transition-opacity duration-200',
                visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
            )}
        >
            <span data-testid="toast-description">{description}</span>
        </div>
    );
}

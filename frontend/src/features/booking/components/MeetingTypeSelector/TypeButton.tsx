import type { ReactNode } from 'react';
import { cn } from '~/libs/cn';

const buttonBaseStyles = cn(
    'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200'
);

const activeButtonStyles = cn(
    'border-cohi-primary bg-cohi-bg-warm text-cohi-primary'
);

const inactiveButtonStyles = cn(
    'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
);

interface TypeButtonProps {
    selected: boolean;
    onClick: () => void;
    icon: ReactNode;
    label: string;
    testId: string;
}

export function TypeButton({ selected, onClick, icon, label, testId }: TypeButtonProps) {
    return (
        <button
            type="button"
            data-testid={testId}
            onClick={onClick}
            className={cn(buttonBaseStyles, selected ? activeButtonStyles : inactiveButtonStyles)}
        >
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}

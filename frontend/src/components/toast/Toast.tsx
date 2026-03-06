import * as RadixToast from '@radix-ui/react-toast';

interface ToastProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    description: string;
}

export function Toast({ open, onOpenChange, description }: ToastProps) {
    return (
        <RadixToast.Root
            open={open}
            onOpenChange={onOpenChange}
            duration={Infinity}
            className="rounded-md bg-[var(--cohi-primary)] px-4 py-2 text-sm font-medium text-[var(--cohi-text-light)] shadow-lg"
            data-testid="toast-root"
        >
            <RadixToast.Description data-testid="toast-description">{description}</RadixToast.Description>
        </RadixToast.Root>
    );
}

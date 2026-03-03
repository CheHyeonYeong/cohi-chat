import * as RadixToast from '@radix-ui/react-toast';

interface ToastProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    description: string;
    duration?: number;
    toastKey?: number;
}

export function Toast({ open, onOpenChange, description, duration = 2500, toastKey }: ToastProps) {
    return (
        <RadixToast.Provider duration={duration}>
            <RadixToast.Root
                key={toastKey}
                open={open}
                onOpenChange={onOpenChange}
                className="rounded-lg bg-[var(--cohe-text-dark)] px-4 py-2 text-sm text-white shadow-lg"
                data-testid="toast-root"
            >
                <RadixToast.Description data-testid="toast-description">{description}</RadixToast.Description>
            </RadixToast.Root>
            <RadixToast.Viewport className="fixed bottom-36 right-6 z-40 flex flex-col gap-2" />
        </RadixToast.Provider>
    );
}

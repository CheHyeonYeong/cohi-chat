import * as RadixToast from '@radix-ui/react-toast';

interface ToastProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    description: string;
}

export const Toast = ({ open, onOpenChange, description }: ToastProps) => <RadixToast.Root
    open={open}
    onOpenChange={onOpenChange}
    duration={Infinity}
    className="rounded-md bg-cohi-primary px-4 py-2 text-sm font-medium text-cohi-text-light shadow-lg"
    data-testid="toast-root"
>
    <RadixToast.Description data-testid="toast-description">{description}</RadixToast.Description>
</RadixToast.Root>;

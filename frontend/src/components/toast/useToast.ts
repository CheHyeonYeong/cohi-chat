import { createContext, useContext } from 'react';

interface ToastContextValue {
    showToast: (description: string, key: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

import { createContext, useCallback, useContext, useState } from 'react';
import { Toast } from './Toast';

interface ToastContextValue {
    showToast: (description: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [toastKey, setToastKey] = useState(0);
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState(2500);

    const showToast = useCallback((desc: string, dur = 2500) => {
        setDescription(desc);
        setDuration(dur);
        setToastKey((k) => k + 1);
        setOpen(true);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast
                open={open}
                onOpenChange={setOpen}
                description={description}
                duration={duration}
                toastKey={toastKey}
            />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

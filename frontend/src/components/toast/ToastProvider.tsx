import { useCallback, useEffect, useRef, useState } from 'react';
import { Toast } from './Toast';
import { ToastContext } from './useToast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState('');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeKeyRef = useRef<string | null>(null);
    const openRef = useRef(false);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const showToast = useCallback((desc: string, key: string, dur = 2500) => {
        if (timerRef.current) clearTimeout(timerRef.current);

        const isSameKey = openRef.current && activeKeyRef.current === key;
        if (!isSameKey) {
            setDescription(desc);
            activeKeyRef.current = key;
            openRef.current = true;
            setOpen(true);
        }

        timerRef.current = setTimeout(() => {
            openRef.current = false;
            activeKeyRef.current = null;
            setOpen(false);
        }, dur);
    }, []);

    const handleOpenChange = useCallback((nextOpen: boolean) => {
        if (!nextOpen) {
            openRef.current = false;
            activeKeyRef.current = null;
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }
        setOpen(nextOpen);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast open={open} onOpenChange={handleOpenChange} description={description} />
        </ToastContext.Provider>
    );
}

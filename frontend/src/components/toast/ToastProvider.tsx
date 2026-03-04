import { useCallback, useRef, useState } from 'react';
import { Toast } from './Toast';
import { ToastContext } from './useToast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState('');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeKeyRef = useRef<string | null>(null);
    const isOpenRef = useRef(false);

    const showToast = useCallback((desc: string, key: string, dur = 2500) => {
        const isSameKey = isOpenRef.current && activeKeyRef.current === key;

        if (!isSameKey) {
            setDescription(desc);
            activeKeyRef.current = key;
            isOpenRef.current = true;
            setOpen(true);
        }

        // 같은 key면 토스트 유지, 다른 key면 새로 표시 — 둘 다 TTL 갱신
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            isOpenRef.current = false;
            activeKeyRef.current = null;
            setOpen(false);
        }, dur);
    }, []);

    const handleOpenChange = useCallback((nextOpen: boolean) => {
        isOpenRef.current = nextOpen;
        if (!nextOpen) {
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
            <Toast
                open={open}
                onOpenChange={handleOpenChange}
                description={description}
            />
        </ToastContext.Provider>
    );
}

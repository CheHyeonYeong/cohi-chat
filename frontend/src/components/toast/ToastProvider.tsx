import { useCallback, useRef, useState } from 'react';
import { Toast } from './Toast';
import { ToastContext } from './useToast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [description, setDescription] = useState('');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeKeyRef = useRef<string | null>(null);
    const visibleRef = useRef(false);

    const showToast = useCallback((desc: string, key: string, dur = 2500) => {
        if (timerRef.current) clearTimeout(timerRef.current);

        const isSameKey = visibleRef.current && activeKeyRef.current === key;
        if (!isSameKey) {
            setDescription(desc);
            activeKeyRef.current = key;
            visibleRef.current = true;
            setVisible(true);
        }

        timerRef.current = setTimeout(() => {
            visibleRef.current = false;
            activeKeyRef.current = null;
            setVisible(false);
        }, dur);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-20 right-6 z-40">
                <Toast visible={visible} description={description} />
            </div>
        </ToastContext.Provider>
    );
}

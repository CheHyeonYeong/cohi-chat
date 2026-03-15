import { useEffect } from 'react';

export function useDocumentTitle(title?: string) {
    useEffect(() => {
        document.title = title ? `${title} | cohiChat` : 'cohiChat';
        return () => { document.title = 'cohiChat'; };
    }, [title]);
}

import { useEffect } from 'react';

export const useDocumentTitle = (title?: string) => {
    useEffect(() => {
        document.title = title ? `${title} | cohiChat` : 'cohiChat';
        return () => { document.title = 'cohiChat'; };
    }, [title]);
};

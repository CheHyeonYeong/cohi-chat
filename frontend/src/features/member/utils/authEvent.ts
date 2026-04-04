const AUTH_CHANGE_EVENT = 'auth-change';

export const dispatchAuthChange = (): void => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
};

export const subscribeAuthChange = (callback: () => void): () => void => {
    if (typeof window === 'undefined') {
        return () => {};
    }
    window.addEventListener('storage', callback);
    window.addEventListener(AUTH_CHANGE_EVENT, callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    };
};

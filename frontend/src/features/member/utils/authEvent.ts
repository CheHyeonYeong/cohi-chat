const AUTH_CHANGE_EVENT = 'auth-change';

export function dispatchAuthChange(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }
}

export function subscribeAuthChange(callback: () => void): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }
    window.addEventListener('storage', callback);
    window.addEventListener(AUTH_CHANGE_EVENT, callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    };
}

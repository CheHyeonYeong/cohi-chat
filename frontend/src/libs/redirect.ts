const REDIRECT_STORAGE_KEY = 'cohi_redirect_url';

/**
 * redirect 경로가 안전한 내부 경로인지 검증한다.
 * 외부 URL, protocol-relative URL, javascript: 등을 차단한다.
 */
export const isValidRedirectPath = (path: string): boolean => {
    if (!path || typeof path !== 'string') return false;
    const trimmed = path.trim();
    if (!trimmed.startsWith('/')) return false;
    if (trimmed.startsWith('//')) return false;
    if (trimmed.includes('://')) return false;
    if (/[\\]/.test(trimmed)) return false;
    return true;
};

/**
 * 검증된 redirect 경로를 반환한다. 유효하지 않으면 fallback('/')을 반환한다.
 */
export const getSafeRedirectPath = (path: string | undefined, fallback: string = '/'): string => {
    if (!path) return fallback;
    const trimmed = path.trim();
    return isValidRedirectPath(trimmed) ? trimmed : fallback;
};

/**
 * OAuth 플로우를 위해 redirect 경로를 sessionStorage에 저장한다.
 */
export const saveRedirectUrl = (path: string): void => {
    if (isValidRedirectPath(path)) {
        sessionStorage.setItem(REDIRECT_STORAGE_KEY, path);
    }
};

/**
 * sessionStorage에서 redirect 경로를 꺼내고 삭제한다.
 */
export const popRedirectUrl = (): string | null => {
    const path = sessionStorage.getItem(REDIRECT_STORAGE_KEY);
    sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
    if (path && isValidRedirectPath(path)) {
        return path;
    }
    return null;
};

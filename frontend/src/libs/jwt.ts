const TOKEN_KEY = 'auth_token';

interface JwtPayload {
    sub: string;
    exp: number;
    iat: number;
    [key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

function isTokenExpired(payload: JwtPayload): boolean {
    if (!payload.exp) {
        return false;
    }
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
}

export function getValidToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
        return null;
    }

    const payload = decodeJwtPayload(token);
    if (!payload || isTokenExpired(payload)) {
        localStorage.removeItem(TOKEN_KEY);
        return null;
    }

    return token;
}

export function getCurrentUsername(): string | null {
    const token = getValidToken();
    if (!token) {
        return null;
    }

    const payload = decodeJwtPayload(token);
    return payload?.sub ?? null;
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event('auth-change'));
}

export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('auth-change'));
}

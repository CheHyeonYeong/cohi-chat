interface JwtPayload {
    sub?: string;
    username?: string;
    exp?: number;
    iat?: number;
    [key: string]: unknown;
}

function parseJwt(token: string): JwtPayload | null {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

function isTokenExpired(payload: JwtPayload): boolean {
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
}

export function getValidToken(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    const payload = parseJwt(token);
    if (!payload || isTokenExpired(payload)) {
        return null;
    }

    return token;
}

export function getCurrentUsername(): string | null {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    const payload = parseJwt(token);
    if (!payload) return null;

    return payload.username ?? payload.sub ?? null;
}

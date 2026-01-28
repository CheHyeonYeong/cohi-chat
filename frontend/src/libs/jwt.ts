const TOKEN_KEY = 'auth_token';

interface JwtPayload {
    sub?: string;
    username?: string; // khs_81의 필드 유지
    exp?: number;
    iat?: number;
    [key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = parts[1];
        // base64Url을 base64로 변환 후 디코딩
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
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
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    if (!payload || isTokenExpired(payload)) {
        localStorage.removeItem(TOKEN_KEY); // 만료된 토큰 정리 (main 로직)
        return null;
    }

    return token;
}

export function getCurrentUsername(): string | null {
    const token = getValidToken();
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    // username이 있으면 쓰고, 없으면 sub를 사용 (khs_81 로직 강화)
    return payload?.username ?? payload?.sub ?? null;
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event('auth-change'));
}

export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event('auth-change'));
}
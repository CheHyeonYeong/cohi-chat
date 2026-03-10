export interface HttpClientOptions extends Omit<RequestInit, 'body'> {
    body?: BodyInit | object;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// 동시 401 요청이 여러 개일 때 refresh를 한 번만 시도하기 위한 Promise 공유
let refreshPromise: Promise<string | null> | null = null;

function safeJsonParse(text: string): unknown {
    try { return text ? JSON.parse(text) : null; } catch { return null; }
}

function buildHeaders(base: HeadersInit | undefined, authToken?: string | null): Headers {
    const headers = new Headers(base);
    if (authToken) {
        headers.set('Authorization', `Bearer ${authToken}`);
    }
    return headers;
}

function buildBody(options: HttpClientOptions, headers: Headers): BodyInit | undefined {
    if (!options.body) return undefined;
    if (
        options.body instanceof FormData ||
        options.body instanceof URLSearchParams ||
        options.body instanceof Blob ||
        options.body instanceof ArrayBuffer ||
        ArrayBuffer.isView(options.body) ||
        typeof options.body === 'string'
    ) {
        return options.body;
    }
    if (typeof options.body === 'object') {
        headers.set('Content-Type', 'application/json');
        return JSON.stringify(options.body);
    }
    return undefined;
}

async function performRefresh(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    try {
        const res = await fetch(`${API_BASE}/members/v1/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        const body = safeJsonParse(await res.text()) as Record<string, unknown> | null;

        if (!res.ok) {
            // Grace Window 히트: 백엔드가 세션 삭제 → 여기서 한 번만 정리 후 throw
            if ((body as { error?: { code?: string } } | null)?.error?.code === 'GRACE_WINDOW_HIT') {
                clearAuthTokens();
                throw new Error('GRACE_WINDOW_HIT');
            }
            return null;
        }

        const data = (body as { data?: { accessToken?: string; refreshToken?: string } } | null)?.data ?? body;
        if (!(data as { accessToken?: string } | null)?.accessToken) return null;

        const d = data as { accessToken: string; refreshToken?: string };
        localStorage.setItem('auth_token', d.accessToken);
        if (d.refreshToken) {
            localStorage.setItem('refresh_token', d.refreshToken);
        }
        window.dispatchEvent(new Event('auth-change'));
        return d.accessToken;
    } catch (err) {
        if (err instanceof Error && err.message === 'GRACE_WINDOW_HIT') {
            throw err;
        }
        return null;
    }
}

function tryRefreshToken(): Promise<string | null> {
    if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

function clearAuthTokens(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    window.dispatchEvent(new Event('auth-change'));
}

async function doRequest<T>(url: string, options: HttpClientOptions, isRetry = false): Promise<T> {
    const headers = buildHeaders(options.headers, localStorage.getItem('auth_token'));
    const body = buildBody(options, headers);

    const response = await fetch(url, { ...options, headers, body });

    // 401 → refresh 시도 후 원래 요청 1회 재시도
    if (response.status === 401 && !isRetry) {
        try {
            const newToken = await tryRefreshToken();
            if (newToken) {
                return doRequest<T>(url, options, true);
            }
            // Refresh 실패 (진짜 만료 등)
            clearAuthTokens();
            throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.', { cause: 401 });
        } catch (err) {
            if (err instanceof Error && err.message === 'GRACE_WINDOW_HIT') {
                // clearAuthTokens는 performRefresh에서 이미 호출됨 (중복 방지)
                throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.', { cause: 401 });
            }
            clearAuthTokens();
            throw err;
        }
    }

    if (!response.ok) {
        const errData = safeJsonParse(await response.text()) as { error?: { message?: string } } | null;
        const message = errData?.error?.message ?? `HTTP error! status: ${response.status}`;
        throw new Error(message, { cause: response.status });
    }

    const text = await response.text();
    if (!text) return undefined as T;
    const data = JSON.parse(text);

    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        return (data as { success: boolean; data: T }).data;
    }
    return data as T;
}

export async function httpClient<T>(url: string, options: HttpClientOptions = {}): Promise<T> {
    return doRequest<T>(url, options);
}

// 인증 불필요 공개 API 전용 — 401 자동 refresh 없음
export async function publicHttpClient<T>(url: string, options: HttpClientOptions = {}): Promise<T> {
    const headers = buildHeaders(options.headers);
    const body = buildBody(options, headers);

    const response = await fetch(url, { ...options, headers, body });

    if (!response.ok) {
        const errData = safeJsonParse(await response.text()) as { error?: { message?: string } } | null;
        const message = errData?.error?.message ?? `HTTP error! status: ${response.status}`;
        throw new Error(message, { cause: response.status });
    }

    const text = await response.text();
    if (!text) return undefined as T;
    const data = JSON.parse(text);
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        return (data as { success: boolean; data: T }).data;
    }
    return data as T;
}

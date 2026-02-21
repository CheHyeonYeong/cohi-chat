export interface HttpClientOptions extends Omit<RequestInit, 'body'> {
    body?: BodyInit | object;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// 동시 401 요청이 여러 개일 때 refresh를 한 번만 시도하기 위한 Promise 공유
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;

    try {
        // httpClient를 통하지 않고 raw fetch로 호출 (순환 의존성 방지)
        const res = await fetch(`${API_BASE}/members/v1/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) return null;

        const body = await res.json();
        const data = body?.data ?? body;
        if (!data?.accessToken) return null;

        localStorage.setItem('auth_token', data.accessToken);
        // RT Rotation: 새 Refresh Token도 함께 저장
        if (data.refreshToken) {
            localStorage.setItem('refresh_token', data.refreshToken);
        }
        window.dispatchEvent(new Event('auth-change'));
        return data.accessToken;
    } catch {
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
    const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
    let body: BodyInit | undefined;

    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (options.body) {
        if (options.body instanceof FormData) {
            body = options.body;
        } else if (typeof options.body === 'object') {
            body = JSON.stringify(options.body);
            headers['Content-Type'] = 'application/json';
        } else {
            body = options.body;
        }
    }

    const response = await fetch(url, { ...options, headers, body });

    // 401 → refresh 시도 후 원래 요청 1회 재시도
    if (response.status === 401 && !isRetry) {
        const newToken = await tryRefreshToken();
        if (newToken) {
            return doRequest<T>(url, options, true);
        }
        // Refresh 실패 → 토큰 삭제 후 auth-change 이벤트 발행 (useAuth가 로그인 페이지로 이동)
        clearAuthTokens();
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.', { cause: 401 });
    }

    if (!response.ok) {
        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error(`HTTP error! status: ${response.status}`, { cause: response.status });
        }
        const message = data?.error?.message ?? `HTTP error! status: ${response.status}`;
        throw new Error(message, { cause: response.status });
    }

    const text = await response.text();
    if (!text) {
        return undefined as T;
    }
    const data = JSON.parse(text);

    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        return (data as { success: boolean; data: T }).data;
    }
    return data as T;
}

export async function httpClient<T>(url: string, options: HttpClientOptions = {}): Promise<T> {
    return doRequest<T>(url, options);
}

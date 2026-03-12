import { clearAuthenticatedUser } from '~/features/member/utils/authStorage';

export interface HttpClientOptions extends Omit<RequestInit, 'body'> {
    body?: BodyInit | object;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const REFRESH_URL = `${API_BASE}/members/v1/refresh`;

let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
    try {
        const response = await fetch(REFRESH_URL, {
            method: 'POST',
            credentials: 'include',
        });

        let payload: unknown = null;
        try {
            payload = await response.json();
        } catch {
            payload = null;
        }

        if (!response.ok) {
            const errorCode = typeof payload === 'object' && payload !== null
                ? (payload as { error?: { code?: string } }).error?.code
                : undefined;
            if (errorCode === 'GRACE_WINDOW_HIT') {
                throw new Error('GRACE_WINDOW_HIT');
            }
            return false;
        }

        return true;
    } catch (error) {
        if (error instanceof Error && error.message === 'GRACE_WINDOW_HIT') {
            throw error;
        }
        return false;
    }
}

function tryRefreshToken(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

function normalizeBody(body: HttpClientOptions['body'], headers: Record<string, string>): BodyInit | undefined {
    if (!body) {
        return undefined;
    }

    if (body instanceof FormData) {
        return body;
    }

    if (typeof body === 'object') {
        headers['Content-Type'] = 'application/json';
        return JSON.stringify(body);
    }

    return body;
}

function shouldRetryWithRefresh(url: string, isRetry: boolean): boolean {
    return !isRetry && url !== REFRESH_URL;
}

async function doRequest<T>(url: string, options: HttpClientOptions, isRetry = false): Promise<T> {
    const headers: Record<string, string> = { ...(options.headers as Record<string, string> | undefined) };
    const body = normalizeBody(options.body, headers);

    const response = await fetch(url, {
        ...options,
        headers,
        body,
        credentials: options.credentials ?? 'include',
    });

    if (response.status === 401 && shouldRetryWithRefresh(url, isRetry)) {
        try {
            const refreshed = await tryRefreshToken();
            if (refreshed) {
                return doRequest<T>(url, options, true);
            }
            clearAuthenticatedUser();
            throw new Error('인증이 만료되었습니다. 다시 로그인해 주세요.', { cause: 401 });
        } catch (error) {
            if (error instanceof Error && error.message === 'GRACE_WINDOW_HIT') {
                throw new Error('토큰 재발급 대기 중입니다. 다시 시도해 주세요.', { cause: 401 });
            }
            clearAuthenticatedUser();
            throw error;
        }
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

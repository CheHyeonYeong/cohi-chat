import { clearAuthenticatedUser } from '~/features/member/utils/authStorage';

export interface HttpClientOptions extends Omit<RequestInit, 'body'> {
    body?: BodyInit | object;
    skipAuthRefresh?: boolean; // true이면 401 자동 refresh 건너뜀 (로그인 등 인증 전 요청)
}

const toHeadersRecord = (init: HeadersInit | undefined): Record<string, string> => {
    if (!init) return {};
    if (init instanceof Headers) {
        const record: Record<string, string> = {};
        init.forEach((value, key) => { record[key] = value; });
        return record;
    }
    if (Array.isArray(init)) {
        return Object.fromEntries(init);
    }
    return { ...(init as Record<string, string>) };
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const REFRESH_URL = `${API_BASE}/members/v1/refresh`;

const GRACE_WINDOW_HIT = 'GRACE_WINDOW_HIT';

let refreshPromise: Promise<boolean> | null = null;

const performRefresh = async (): Promise<boolean> => {
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
            if (errorCode === GRACE_WINDOW_HIT) {
                throw new Error(GRACE_WINDOW_HIT);
            }
            return false;
        }

        return true;
    } catch (error) {
        if (error instanceof Error && error.message === GRACE_WINDOW_HIT) {
            throw error;
        }
        return false;
    }
};

const tryRefreshToken = (): Promise<boolean> => {
    if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
};

const normalizeBody = (body: HttpClientOptions['body'], headers: Record<string, string>): BodyInit | undefined => {
    if (!body) {
        return undefined;
    }

    if (
        body instanceof FormData ||
        body instanceof URLSearchParams ||
        body instanceof Blob ||
        body instanceof ArrayBuffer ||
        ArrayBuffer.isView(body) ||
        typeof body === 'string'
    ) {
        return body as BodyInit;
    }

    if (typeof body === 'object') {
        headers['Content-Type'] = 'application/json';
        return JSON.stringify(body);
    }

    return undefined;
};

const shouldRetryWithRefresh = (url: string, isRetry: boolean, skipAuthRefresh: boolean): boolean => !isRetry && !skipAuthRefresh && url !== REFRESH_URL;

const doRequest = async <T>(url: string, options: HttpClientOptions, isRetry = false): Promise<T> => {
    const { skipAuthRefresh = false, ...fetchOptions } = options;
    const headers = toHeadersRecord(fetchOptions.headers);
    const body = normalizeBody(fetchOptions.body, headers);

    const response = await fetch(url, {
        ...fetchOptions,
        headers,
        body,
        credentials: fetchOptions.credentials ?? 'include',
    });

    if (response.status === 401 && shouldRetryWithRefresh(url, isRetry, skipAuthRefresh)) {
        try {
            const refreshed = await tryRefreshToken();
            if (refreshed) {
                return doRequest<T>(url, options, true);
            }
            throw new Error('인증이 만료되었습니다. 다시 로그인해 주세요.', { cause: 401 });
        } catch (error) {
            if (error instanceof Error && error.message === GRACE_WINDOW_HIT) {
                // GRACE_WINDOW_HIT는 유예 기간 중 경쟁 상태로, 재시도가 가능한 임시 상태
                // 인증 상태를 유지해야 사용자가 재시도할 수 있음
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

    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`Invalid JSON response`, { cause: response.status });
    }
    if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
        if ((data as { success: boolean }).success === false) {
            const msg = (data as { error?: { message?: string } }).error?.message ?? `API error`;
            throw new Error(msg, { cause: response.status });
        }
        return (data as { success: boolean; data: T }).data;
    }
    return data as T;
};

export const httpClient = async <T>(url: string, options: HttpClientOptions = {}): Promise<T> => doRequest<T>(url, options);

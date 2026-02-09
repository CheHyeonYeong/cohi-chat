import { camelToSnake, snakeToCamel } from "./utils";

export interface HttpClientOptions extends Omit<RequestInit, 'body'> {
    body?: BodyInit | object;
}

export async function httpClient<T>(url: string, options: HttpClientOptions = {}): Promise<T> {
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
            body = JSON.stringify(camelToSnake(options.body as object));
            headers['Content-Type'] = 'application/json';
        } else {
            body = options.body;
        }
    }

    const fetchOptions: RequestInit = {
        ...options,
        headers,
        body,
    };

    const response = await fetch(url, fetchOptions);

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
    return snakeToCamel(data) as T;
} 
import { httpClient } from '~/libs/httpClient';
import type { LoginResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const OAUTH_API = `${API_BASE}/oauth/v1`;

export async function getOAuthAuthorizationUrlApi(provider: string): Promise<string> {
    const response = await httpClient<{ url: string }>(`${OAUTH_API}/${provider}/authorize`);
    return response.url;
}

export async function oAuthCallbackApi(provider: string, code: string): Promise<LoginResponse> {
    const response = await httpClient<LoginResponse>(`${OAUTH_API}/${provider}/callback`, {
        method: 'POST',
        body: { code },
    });
    if (!response?.accessToken) {
        throw new Error('소셜 로그인 응답이 올바르지 않습니다.');
    }
    return response;
}

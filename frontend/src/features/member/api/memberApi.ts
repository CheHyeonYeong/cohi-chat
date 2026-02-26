import { httpClient } from '~/libs/httpClient';
import type {
    LoginRequest,
    LoginResponse,
    LoginCredentials,
    SignupPayload,
    SignupResponse,
    MemberResponseDTO,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const MEMBER_API = `${API_BASE}/members/v1`;

export async function loginApi(credentials: LoginCredentials): Promise<LoginResponse> {
    const request: LoginRequest = {
        ...credentials,
        provider: 'LOCAL',
    };

    const response = await httpClient<LoginResponse>(`${MEMBER_API}/login`, {
        method: 'POST',
        body: request,
    });

    if (!response) {
        throw new Error('서버로부터 응답을 받지 못했습니다.');
    }
    if (!response.accessToken) {
        throw new Error('로그인 응답이 올바르지 않습니다.');
    }

    return response;
}

export async function signupApi(payload: SignupPayload): Promise<SignupResponse> {
    const response = await httpClient<SignupResponse>(`${MEMBER_API}/signup`, {
        method: 'POST',
        body: payload,
    });

    if (!response) {
        throw new Error('회원가입에 실패했습니다.');
    }

    return response;
}

export async function logoutApi(): Promise<void> {
    await httpClient<void>(`${MEMBER_API}/logout`, {
        method: 'DELETE',
    });
}

export async function refreshTokenApi(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        throw new Error('Refresh token이 없습니다.');
    }
    const response = await httpClient<LoginResponse>(`${MEMBER_API}/refresh`, {
        method: 'POST',
        body: { refreshToken },
    });
    if (!response || !response.accessToken) {
        throw new Error('토큰 갱신에 실패했습니다.');
    }
    return response;
}

export async function requestPasswordResetApi(email: string): Promise<void> {
    await httpClient<void>(`${API_BASE}/auth/password-reset/request`, {
        method: 'POST',
        body: { email },
    });
}

export async function verifyResetTokenApi(token: string): Promise<void> {
    await httpClient<void>(`${API_BASE}/auth/password-reset/verify`, {
        method: 'POST',
        body: { token },
    });
}

export async function confirmPasswordResetApi(token: string, newPassword: string): Promise<void> {
    await httpClient<void>(`${API_BASE}/auth/password-reset/confirm`, {
        method: 'POST',
        body: { token, newPassword },
    });
}

export async function getUserApi(username: string): Promise<MemberResponseDTO> {
    return httpClient<MemberResponseDTO>(
        `${MEMBER_API}/${encodeURIComponent(username)}`
    );
}

import { httpClient } from '~/libs/httpClient';
import type {
    LoginRequest,
    LoginResponse,
    LoginCredentials,
    SignupPayload,
    SignupResponse,
    MemberResponseDTO,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * httpClient의 body 타입 주의사항
 * - httpClient 내부에서 object를 JSON.stringify 처리함
 * - RequestInit.body 타입은 BodyInit이지만, httpClient는 object도 허용
 * - 타입 시스템 한계로 as unknown as BodyInit 캐스팅 사용
 */

export async function loginApi(credentials: LoginCredentials): Promise<LoginResponse> {
    const request: LoginRequest = {
        ...credentials,
        provider: 'LOCAL',
    };

    const response = await httpClient<LoginResponse>(`${API_URL}/members/v1/login`, {
        method: 'POST',
        body: request as unknown as BodyInit,
    });

    if (!response || !response.accessToken) {
        throw new Error('Login failed');
    }

    return response;
}

export async function signupApi(payload: SignupPayload): Promise<SignupResponse> {
    const response = await httpClient<SignupResponse>(`${API_URL}/members/v1/signup`, {
        method: 'POST',
        body: payload as unknown as BodyInit,
    });

    if (!response) {
        throw new Error('Signup failed');
    }

    return response;
}

/**
 * 로그아웃 API
 *
 * Note: httpClient 대신 fetch 직접 사용 이유
 * - httpClient는 response.json()을 호출하여 JSON 응답을 기대함
 * - logout API는 응답 body가 없거나 빈 응답을 반환할 수 있음
 * - 또한 token을 명시적으로 전달받아 사용 (localStorage 의존 제거)
 */
export async function logoutApi(token: string): Promise<void> {
    const response = await fetch(`${API_URL}/members/v1/logout`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        console.warn(`로그아웃 API 실패: ${response.status}`);
    }
}

export async function getUserApi(username: string): Promise<MemberResponseDTO> {
    return httpClient<MemberResponseDTO>(
        `${API_URL}/members/v1/${encodeURIComponent(username)}`
    );
}

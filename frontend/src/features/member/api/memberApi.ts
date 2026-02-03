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

/**
 * 로그인 API를 호출합니다.
 *
 * @param credentials - 로그인 자격 증명 (username, password)
 * @returns 로그인 응답 (토큰 포함)
 * @throws {Error} 로그인 실패 시
 */
export async function loginApi(credentials: LoginCredentials): Promise<LoginResponse> {
    const request: LoginRequest = {
        ...credentials,
        provider: 'LOCAL',
    };

    const response = await httpClient<LoginResponse>(`${MEMBER_API}/login`, {
        method: 'POST',
        body: request as unknown as BodyInit,
    });

    if (!response?.accessToken) {
        throw new Error('Login failed');
    }

    return response;
}

/**
 * 회원가입 API를 호출합니다.
 *
 * @param payload - 회원가입 정보
 * @returns 회원가입 응답
 * @throws {Error} 회원가입 실패 시
 */
export async function signupApi(payload: SignupPayload): Promise<SignupResponse> {
    const response = await httpClient<SignupResponse>(`${MEMBER_API}/signup`, {
        method: 'POST',
        body: payload as unknown as BodyInit,
    });

    if (!response) {
        throw new Error('Signup failed');
    }

    return response;
}

/**
 * 로그아웃 API를 호출합니다.
 *
 * @param token - 인증 토큰
 * @throws {Error} 로그아웃 실패 시
 */
export async function logoutApi(token: string): Promise<void> {
    const response = await fetch(`${MEMBER_API}/logout`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Logout failed: ${response.status}`);
    }
}

/**
 * 사용자 정보 조회 API를 호출합니다.
 *
 * @param username - 조회할 사용자 이름
 * @returns 사용자 정보
 */
export async function getUserApi(username: string): Promise<MemberResponseDTO> {
    return httpClient<MemberResponseDTO>(
        `${MEMBER_API}/${encodeURIComponent(username)}`
    );
}

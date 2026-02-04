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

    if (!response?.accessToken) {
        throw new Error('Login failed');
    }

    return response;
}

export async function signupApi(payload: SignupPayload): Promise<SignupResponse> {
    const response = await httpClient<SignupResponse>(`${MEMBER_API}/signup`, {
        method: 'POST',
        body: payload,
    });

    if (!response) {
        throw new Error('Signup failed');
    }

    return response;
}

export async function logoutApi(): Promise<void> {
    await httpClient<void>(`${MEMBER_API}/logout`, {
        method: 'DELETE',
    });
}

export async function getUserApi(username: string): Promise<MemberResponseDTO> {
    return httpClient<MemberResponseDTO>(
        `${MEMBER_API}/${encodeURIComponent(username)}`
    );
}

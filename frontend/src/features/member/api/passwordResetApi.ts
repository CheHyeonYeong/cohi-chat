import { httpClient } from '~/libs/httpClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const PASSWORD_RESET_API = `${API_BASE}/auth/password-reset`;

export async function requestPasswordResetApi(email: string): Promise<{ message: string }> {
    const response = await httpClient<{ message: string }>(`${PASSWORD_RESET_API}/request`, {
        method: 'POST',
        body: { email },
    });
    if (!response) throw new Error('요청에 실패했습니다.');
    return response;
}

export async function verifyResetTokenApi(token: string): Promise<{ valid: boolean }> {
    const response = await httpClient<{ valid: boolean }>(`${PASSWORD_RESET_API}/verify?token=${encodeURIComponent(token)}`);
    if (!response) throw new Error('토큰 검증에 실패했습니다.');
    return response;
}

export async function confirmPasswordResetApi(token: string, password: string): Promise<{ message: string }> {
    const response = await httpClient<{ message: string }>(`${PASSWORD_RESET_API}/confirm`, {
        method: 'POST',
        body: { token, password },
    });
    if (!response) throw new Error('비밀번호 재설정에 실패했습니다.');
    return response;
}

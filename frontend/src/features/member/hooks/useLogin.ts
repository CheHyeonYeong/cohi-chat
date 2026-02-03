import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { loginApi } from '../api/memberApi';
import { dispatchAuthChange } from '../utils/authEvent';
import type { LoginCredentials, LoginResponse } from '../types';

/**
 * 로그인 API를 호출하는 mutation 훅입니다.
 *
 * 기능:
 * - 로그인 API 호출 및 응답 처리
 * - 성공 시 localStorage에 토큰 및 username 저장
 * - auth-change 이벤트 발생으로 인증 상태 변경 알림
 *
 * @returns UseMutationResult - React Query mutation 결과
 */
export function useLogin(): UseMutationResult<LoginResponse, Error, LoginCredentials> {
    return useMutation<LoginResponse, Error, LoginCredentials>({
        mutationFn: async (credentials) => {
            const response = await loginApi(credentials);

            localStorage.setItem('auth_token', response.accessToken);
            localStorage.setItem('refresh_token', response.refreshToken);
            localStorage.setItem('username', response.username);

            dispatchAuthChange();

            return response;
        },
        onError: (error) => {
            console.error('Login error:', error);
        },
    });
}

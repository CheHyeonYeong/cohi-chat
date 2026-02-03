import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { loginApi } from '../api/memberApi';
import { dispatchAuthChange } from '../utils/authEvent';
import type { LoginCredentials, LoginResponse } from '../types';

/**
 * 로그인 API를 호출하는 mutation 훅입니다.
 *
 * 기능:
 * - 로그인 API 호출 및 응답 처리
 * - 성공 시 localStorage에 토큰(auth_token, refresh_token) 및 username 저장
 * - auth-change 이벤트 발생으로 다른 컴포넌트에 인증 상태 변경 알림
 *
 * @returns UseMutationResult - React Query mutation 결과
 * - mutate: 로그인 요청 함수 (credentials: LoginCredentials)
 * - isPending: 요청 진행 중 여부
 * - isError: 에러 발생 여부
 * - isSuccess: 성공 여부
 */
export function useLogin(): UseMutationResult<LoginResponse, Error, LoginCredentials> {
    return useMutation<LoginResponse, Error, LoginCredentials>({
        mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
            const response = await loginApi(credentials);

            localStorage.setItem('auth_token', response.accessToken);
            localStorage.setItem('refresh_token', response.refreshToken);
            localStorage.setItem('username', response.username);

            dispatchAuthChange();

            return response;
        },
        onError: (error: Error) => {
            console.error('Login error:', error);
        },
    });
}

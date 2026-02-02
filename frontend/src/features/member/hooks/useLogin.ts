import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { loginApi } from '../api/memberApi';
import { dispatchAuthChange } from '../utils/authEvent';
import type { LoginCredentials, LoginResponse } from '../types';

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

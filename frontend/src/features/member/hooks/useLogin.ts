import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { loginApi } from '../api/memberApi';
import { saveAuthTokens } from '../utils/authStorage';
import type { LoginCredentials, LoginResponse } from '../types';

export function useLogin(): UseMutationResult<LoginResponse, Error, LoginCredentials> {
    const queryClient = useQueryClient();

    return useMutation<LoginResponse, Error, LoginCredentials>({
        mutationFn: async (credentials) => {
            const response = await loginApi(credentials);
            queryClient.removeQueries({ queryKey: ['my-bookings'] });
            queryClient.removeQueries({ queryKey: ['booking'] });
            saveAuthTokens(response);
            return response;
        },
        onError: (error) => {
            console.error('Login error:', error);
        },
    });
}

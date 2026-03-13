import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { loginApi } from '../api/memberApi';
import { saveAuthTokens } from '../utils/authStorage';
import type { LoginCredentials, LoginResponse } from '../types';

export function useLogin(): UseMutationResult<LoginResponse, Error, LoginCredentials> {
    return useMutation<LoginResponse, Error, LoginCredentials>({
        mutationFn: async (credentials) => {
            const response = await loginApi(credentials);
            saveAuthTokens(response);
            return response;
        },
        // Expected credential failures are handled by UI state, not console noise.
        onError: () => {},
    });
}

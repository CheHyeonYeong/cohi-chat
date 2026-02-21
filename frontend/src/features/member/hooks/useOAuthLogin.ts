import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { oAuthCallbackApi } from '../api/oAuthApi';
import { dispatchAuthChange } from '../utils/authEvent';
import type { LoginResponse } from '../types';

interface OAuthLoginParams {
    provider: string;
    code: string;
    state: string;
}

export function useOAuthLogin(): UseMutationResult<LoginResponse, Error, OAuthLoginParams> {
    return useMutation<LoginResponse, Error, OAuthLoginParams>({
        mutationFn: async ({ provider, code, state }) => {
            const response = await oAuthCallbackApi(provider, code, state);

            localStorage.setItem('auth_token', response.accessToken);
            localStorage.setItem('refresh_token', response.refreshToken);
            localStorage.setItem('username', response.username);

            dispatchAuthChange();

            return response;
        },
        onError: (error) => {
            console.error('OAuth login error:', error);
        },
    });
}

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { oAuthCallbackApi } from '../api/oAuthApi';
import { saveAuthTokens } from '../utils/authStorage';
import type { LoginResponse } from '../types';

interface OAuthLoginParams {
    provider: string;
    code: string;
    state: string;
}

export function useOAuthLogin(): UseMutationResult<LoginResponse, Error, OAuthLoginParams> {
    const queryClient = useQueryClient();

    return useMutation<LoginResponse, Error, OAuthLoginParams>({
        mutationFn: async ({ provider, code, state }) => {
            const response = await oAuthCallbackApi(provider, code, state);
            queryClient.removeQueries({ queryKey: ['my-bookings'] });
            queryClient.removeQueries({ queryKey: ['booking'] });
            saveAuthTokens(response);
            return response;
        },
    });
}
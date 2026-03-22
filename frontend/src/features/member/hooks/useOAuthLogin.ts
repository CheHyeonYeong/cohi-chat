import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { bookingKeys } from '~/features/booking/hooks/queryKeys';
import { oAuthCallbackApi } from '../api/oAuthApi';
import { saveAuthenticatedUser } from '../utils/authStorage';
import { authKeys } from './queryKeys';
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
            return response;
        },
        onSuccess: () => {
            saveAuthenticatedUser();
            void queryClient.invalidateQueries({ queryKey: authKeys.all() });
            queryClient.removeQueries({ queryKey: bookingKeys.myBookingsAll() });
            queryClient.removeQueries({ queryKey: bookingKeys.bookingAll() });
        },
    });
}

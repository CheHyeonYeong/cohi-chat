import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { bookingKeys } from '~/features/booking/hooks/queryKeys';
import { oAuthCallbackApi } from '../api/oAuthApi';
import { saveAuthenticatedUser } from '../utils/authStorage';
import type { LoginResponse } from '../types';

interface OAuthLoginParams {
    provider: string;
    code: string;
    state: string;
}

export const useOAuthLogin = (): UseMutationResult<LoginResponse, Error, OAuthLoginParams> => {
    const queryClient = useQueryClient();

    return useMutation<LoginResponse, Error, OAuthLoginParams>({
        mutationFn: async ({ provider, code, state }) => {
            const response = await oAuthCallbackApi(provider, code, state);
            saveAuthenticatedUser(response);
            return response;
        },
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: bookingKeys.myBookingsAll() });
            queryClient.removeQueries({ queryKey: bookingKeys.bookingAll() });
        },
    });
};

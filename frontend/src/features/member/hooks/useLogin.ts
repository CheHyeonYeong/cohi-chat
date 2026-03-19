import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { bookingKeys } from '~/features/booking/hooks/queryKeys';
import { loginApi } from '../api/memberApi';
import { saveAuthTokens } from '../utils/authStorage';
import type { LoginCredentials, LoginResponse } from '../types';

export function useLogin(): UseMutationResult<LoginResponse, Error, LoginCredentials> {
    const queryClient = useQueryClient();

    return useMutation<LoginResponse, Error, LoginCredentials>({
        mutationFn: async (credentials) => {
            const response = await loginApi(credentials);
            saveAuthTokens(response);
            return response;
        },
        onSuccess: () => {
            queryClient.removeQueries({ queryKey: bookingKeys.myBookingsAll() });
            queryClient.removeQueries({ queryKey: bookingKeys.bookingAll() });
        },
    });
}

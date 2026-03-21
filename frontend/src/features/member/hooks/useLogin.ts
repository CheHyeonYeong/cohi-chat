import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { bookingKeys } from '~/features/booking/hooks/queryKeys';
import { loginApi } from '../api/memberApi';
import { saveAuthenticatedUser } from '../utils/authStorage';
import type { LoginCredentials, LoginResponse } from '../types';

export function useLogin(): UseMutationResult<LoginResponse, Error, LoginCredentials> {
    const queryClient = useQueryClient();

    return useMutation<LoginResponse, Error, LoginCredentials>({
        mutationFn: async (credentials) => {
            const response = await loginApi(credentials);
            return response;
        },
        onSuccess: (response) => {
            saveAuthenticatedUser(response);
            void queryClient.invalidateQueries({ queryKey: ['auth'] });
            queryClient.removeQueries({ queryKey: bookingKeys.myBookingsAll() });
            queryClient.removeQueries({ queryKey: bookingKeys.bookingAll() });
        },
        onError: (error) => {
            if (error.cause !== 401) {
                console.error('Login error:', error);
            }
        },
    });
}

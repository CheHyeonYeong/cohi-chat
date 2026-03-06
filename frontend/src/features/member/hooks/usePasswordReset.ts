import { useMutation, useQuery } from '@tanstack/react-query';
import { requestPasswordResetApi, verifyResetTokenApi, confirmPasswordResetApi } from '../api/passwordResetApi';

export function useRequestPasswordReset() {
    return useMutation({
        mutationFn: (email: string) => requestPasswordResetApi(email),
    });
}

export function useVerifyResetToken(token: string | undefined) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['verify-reset-token', token],
        queryFn: () => verifyResetTokenApi(token!),
        enabled: !!token,
        retry: false,
        staleTime: Infinity,
    });

    return {
        isLoading,
        isTokenValid: data?.valid === true,
        isTokenInvalid: !token || isError || (data !== undefined && !data.valid),
    };
}

export function useConfirmPasswordReset() {
    return useMutation({
        mutationFn: ({ token, password }: { token: string; password: string }) =>
            confirmPasswordResetApi(token, password),
    });
}

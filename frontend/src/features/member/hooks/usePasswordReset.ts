import { useMutation, useQuery } from '@tanstack/react-query';
import { requestPasswordResetApi, verifyResetTokenApi, confirmPasswordResetApi } from '../api/passwordResetApi';

export const useRequestPasswordReset = () => useMutation({
    mutationFn: (email: string) => requestPasswordResetApi(email),
});

export const useVerifyResetToken = (token: string | undefined) => {
    const { data, isLoading, isFetching, isError } = useQuery({
        queryKey: ['verify-reset-token', token],
        queryFn: () => verifyResetTokenApi(token!),
        enabled: !!token,
        retry: false,
        refetchOnMount: 'always',
    });

    return {
        isLoading: isLoading || isFetching,
        isTokenValid: data?.valid === true,
        isTokenInvalid: !token || (data !== undefined && !data.valid),
        isVerificationError: isError,
    };
};

export const useConfirmPasswordReset = () => useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
        confirmPasswordResetApi(token, password),
});

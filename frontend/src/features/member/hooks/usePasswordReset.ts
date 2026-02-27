import { useMutation } from '@tanstack/react-query';
import { requestPasswordResetApi, verifyResetTokenApi, confirmPasswordResetApi } from '../api/passwordResetApi';

export function useRequestPasswordReset() {
    return useMutation({
        mutationFn: (email: string) => requestPasswordResetApi(email),
    });
}

export function useVerifyResetToken() {
    return useMutation({
        mutationFn: (token: string) => verifyResetTokenApi(token),
    });
}

export function useConfirmPasswordReset() {
    return useMutation({
        mutationFn: ({ token, password }: { token: string; password: string }) =>
            confirmPasswordResetApi(token, password),
    });
}

import { useMutation } from '@tanstack/react-query';
import {
    requestPasswordResetApi,
    verifyResetTokenApi,
    confirmPasswordResetApi,
} from '../api/memberApi';

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
        mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
            confirmPasswordResetApi(token, newPassword),
    });
}

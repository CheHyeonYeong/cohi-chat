import { useMutation, UseMutationResult } from '@tanstack/react-query';
import {
    requestPasswordResetApi,
    confirmPasswordResetApi,
} from '../api/memberApi';
import type {
    PasswordResetRequestPayload,
    PasswordResetConfirmPayload,
    PasswordResetResponse,
} from '../types';

export function usePasswordResetRequest(): UseMutationResult<
    PasswordResetResponse,
    Error,
    PasswordResetRequestPayload
    > {
    return useMutation<PasswordResetResponse, Error, PasswordResetRequestPayload>({
        mutationFn: requestPasswordResetApi,
        onError: (error) => {
            console.error('Password reset request error:', error);
        },
    });
}

export function usePasswordResetConfirm(): UseMutationResult<
    PasswordResetResponse,
    Error,
    PasswordResetConfirmPayload
    > {
    return useMutation<PasswordResetResponse, Error, PasswordResetConfirmPayload>({
        mutationFn: confirmPasswordResetApi,
        onError: (error) => {
            console.error('Password reset confirm error:', error);
        },
    });
}

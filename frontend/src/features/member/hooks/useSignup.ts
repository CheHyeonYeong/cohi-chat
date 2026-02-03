import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { signupApi } from '../api/memberApi';
import type { SignupPayload, SignupResponse } from '../types';

export function useSignup(): UseMutationResult<SignupResponse, Error, SignupPayload> {
    return useMutation<SignupResponse, Error, SignupPayload>({
        mutationFn: signupApi,
        onError: (error) => {
            console.error('Signup error:', error);
        },
    });
}

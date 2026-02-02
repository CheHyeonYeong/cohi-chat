import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { signupApi } from '../api/memberApi';
import type { SignupPayload, SignupResponse } from '../types';

export function useSignup(): UseMutationResult<SignupResponse, Error, SignupPayload> {
    return useMutation<SignupResponse, Error, SignupPayload>({
        mutationFn: async (payload: SignupPayload): Promise<SignupResponse> => {
            return signupApi(payload);
        },
        onError: (error: Error) => {
            console.error('Signup error:', error);
        },
    });
}

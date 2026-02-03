import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { signupApi } from '../api/memberApi';
import type { SignupPayload, SignupResponse } from '../types';

/**
 * 회원가입 API를 호출하는 mutation 훅입니다.
 *
 * @returns UseMutationResult - React Query mutation 결과
 */
export function useSignup(): UseMutationResult<SignupResponse, Error, SignupPayload> {
    return useMutation<SignupResponse, Error, SignupPayload>({
        mutationFn: signupApi,
        onError: (error) => {
            console.error('Signup error:', error);
        },
    });
}

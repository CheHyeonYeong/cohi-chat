import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { signupApi } from '../api/memberApi';
import type { SignupPayload, SignupResponse } from '../types';

/**
 * 회원가입 API를 호출하는 mutation 훅입니다.
 *
 * @returns UseMutationResult - React Query mutation 결과
 * - mutate: 회원가입 요청 함수
 * - isPending: 요청 진행 중 여부
 * - isError: 에러 발생 여부
 * - isSuccess: 성공 여부
 */
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

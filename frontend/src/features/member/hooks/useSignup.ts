import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { signupApi } from '../api/memberApi';
import type { SignupPayload, SignupResponse } from '../types';

export const useSignup = (): UseMutationResult<SignupResponse, Error, SignupPayload> => useMutation<SignupResponse, Error, SignupPayload>({
    mutationFn: signupApi,
});

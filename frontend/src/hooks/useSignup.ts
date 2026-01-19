import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { httpClient } from '~/libs/httpClient';

interface SignupPayload {
    username: string;
    email: string;
    displayName?: string;
    password: string;
}

interface SignupResponse {
    id: string;
    username: string;
    displayName: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export function useSignup(): UseMutationResult<SignupResponse, Error, SignupPayload> {
    const navigate = useNavigate();

    return useMutation<SignupResponse, Error, SignupPayload>({
        mutationFn: async (payload: SignupPayload): Promise<SignupResponse> => {
            const response = await httpClient<SignupResponse>(`${API_URL}/members/v1/signup`, {
                method: 'POST',
                body: payload as unknown as BodyInit,
            });

            if (!response) {
                throw new Error('Signup failed');
            }

            return response;
        },
        onSuccess: () => {
            // 회원가입 성공 후 로그인 페이지로 이동
            setTimeout(() => {
                navigate({
                    to: '/app/login',
                });
            }, 1500);
        },
        onError: (error: Error) => {
            console.error('Signup error:', error);
        },
    });
}

import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { httpClient } from '~/libs/httpClient';

interface LoginCredentials {
    username: string;
    password: string;
}

interface LoginRequest {
    username: string;
    password: string;
    provider: string;
}

interface LoginResponse {
    accessToken: string;
    expiredInMinutes: number;
    refreshToken: string;
    username: string;
    displayName: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export function useLogin(): UseMutationResult<LoginResponse, Error, LoginCredentials> {
    const navigate = useNavigate();

    return useMutation<LoginResponse, Error, LoginCredentials>({
        mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
            const request: LoginRequest = {
                ...credentials,
                provider: 'LOCAL',
            };

            const response = await httpClient<LoginResponse>(`${API_URL}/members/v1/login`, {
                method: 'POST',
                body: request as unknown as BodyInit,
            });

            if (!response || !response.accessToken) {
                throw new Error('Login failed');
            }

            localStorage.setItem('auth_token', response.accessToken);
            localStorage.setItem('refresh_token', response.refreshToken);
            localStorage.setItem('username', response.username);
            return response;
        },
        onSuccess: () => {
            navigate({
                to: '/app',
            });
        },
        onError: (error: Error) => {
            console.error('Login error:', error);
        },
    });
} 
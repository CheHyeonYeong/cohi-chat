import {useMutation, UseMutationResult} from '@tanstack/react-query';
import {useNavigate} from '@tanstack/react-router';
import {httpClient} from '~/libs/httpClient';

interface LoginCredentials {
    username: string;
    password: string;
}

interface LoginResponse {
    accessToken: string;
    expiredInSeconds: number;
    refreshToken: string;
    username: string;
    displayName: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * 인증 상태 변경을 알리는 이벤트를 발생시킵니다.
 * useAuth에서 이 이벤트를 구독하여 상태를 갱신합니다.
 */
function dispatchAuthChange() {
    window.dispatchEvent(new Event('auth-change'));
}

export function useLogin(): UseMutationResult<LoginResponse, Error, LoginCredentials> {
    const navigate = useNavigate();

    return useMutation<LoginResponse, Error, LoginCredentials>({
        mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
            const response = await httpClient<LoginResponse>(`${API_URL}/member/v1/login`, {
                method: 'POST',
                body: credentials as unknown as Record<string, unknown>,
            });

            if (!response || !response.accessToken) {
                throw new Error('Login failed');
            }

            localStorage.setItem('auth_token', response.accessToken);
            localStorage.setItem('username', response.username);
            dispatchAuthChange();
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
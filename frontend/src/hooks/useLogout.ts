import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export function useLogout(): UseMutationResult<void, Error, void> {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation<void, Error, void>({
        mutationFn: async (): Promise<void> => {
            const authToken = localStorage.getItem('auth_token');

            if (authToken) {
                await fetch(`${API_URL}/members/v1/logout`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
            }
        },
        onSettled: () => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('username');

            queryClient.clear();

            navigate({
                to: '/app/login',
            });
        },
        onError: (error: Error) => {
            console.error('Logout error:', error);
        },
    });
}

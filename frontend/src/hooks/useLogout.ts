import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function dispatchAuthChange() {
    window.dispatchEvent(new Event('auth-change'));
}

export function useLogout() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const logout = useCallback(async () => {
        const authToken = localStorage.getItem('auth_token');

        if (authToken) {
            try {
                const response = await fetch(`${API_URL}/members/v1/logout`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                if (!response.ok) {
                    console.warn(`로그아웃 API 실패: ${response.status}`);
                }
            } catch (error) {
                console.warn('로그아웃 API 호출 중 오류:', error);
            }
        }

        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');

        queryClient.clear();

        dispatchAuthChange();

        navigate({ to: '/app/login', replace: true });
    }, [navigate, queryClient]);

    return { logout };
}

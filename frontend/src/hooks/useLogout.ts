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
                await fetch(`${API_URL}/members/v1/logout`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
            } catch {
                // 서버 로그아웃 실패해도 클라이언트 로그아웃은 진행
            }
        }

        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');

        queryClient.clear();

        dispatchAuthChange();

        navigate({ to: '/app/login' });
    }, [navigate, queryClient]);

    return { logout };
}

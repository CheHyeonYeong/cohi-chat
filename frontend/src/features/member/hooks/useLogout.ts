import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { logoutApi } from '../api/memberApi';
import { dispatchAuthChange } from '../utils/authEvent';

export function useLogout() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const logout = useCallback(async () => {
        const authToken = localStorage.getItem('auth_token');

        if (authToken) {
            try {
                await logoutApi(authToken);
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

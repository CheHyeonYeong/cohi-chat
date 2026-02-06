import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { logoutApi } from '../api/memberApi';
import { dispatchAuthChange } from '../utils/authEvent';

export function useLogout() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const logout = useCallback(async () => {
        const hasToken = !!localStorage.getItem('auth_token');

        if (hasToken) {
            try {
                await logoutApi();
            } catch (error) {
                console.warn('Logout API error:', error);
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

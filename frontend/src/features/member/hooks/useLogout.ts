import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { logoutApi } from '../api/memberApi';
import { clearAuthenticatedUser } from '../utils/authStorage';

export function useLogout() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const logout = useCallback(async () => {
        try {
            await logoutApi();
        } catch (error) {
            console.warn('Logout API error:', error);
        }

        queryClient.clear();
        clearAuthenticatedUser();

        navigate({ to: '/login', replace: true });
    }, [navigate, queryClient]);

    return { logout };
}

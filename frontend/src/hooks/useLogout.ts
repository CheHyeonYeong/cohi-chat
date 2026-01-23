import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';

function dispatchAuthChange() {
    window.dispatchEvent(new Event('auth-change'));
}

export function useLogout() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const logout = useCallback(() => {

        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username');

        queryClient.clear();

        dispatchAuthChange();

        navigate({
            to: '/app/login',
        });
    }, [navigate, queryClient]);

    return { logout };
}

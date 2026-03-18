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
        } catch {
            // 로그아웃 API 실패 시에도 로컬 상태는 항상 정리
        } finally {
            queryClient.clear();
            clearAuthenticatedUser();
            navigate({ to: '/login', replace: true });
        }
    }, [navigate, queryClient]);

    return { logout };
}

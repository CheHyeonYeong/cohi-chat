import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { logoutApi } from '../api/memberApi';
import { clearAuthenticatedUser } from '../utils/authStorage';
import { useToast } from '~/components/toast';

export const useLogout = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    const logout = useCallback(async () => {
        try {
            await logoutApi();
        } catch (error) {
            console.warn('Logout API error:', error);
            // 서버 HttpOnly 쿠키는 JS로 직접 삭제 불가하므로 API 실패 시 세션이 남을 수 있음
            showToast('로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.', 'logout-error');
            return;
        }

        queryClient.clear();
        clearAuthenticatedUser();
        navigate({ to: '/login', replace: true });
    }, [navigate, queryClient, showToast]);

    return { logout };
};

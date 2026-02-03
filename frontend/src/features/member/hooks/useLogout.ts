import { useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { logoutApi } from '../api/memberApi';
import { dispatchAuthChange } from '../utils/authEvent';

/**
 * 로그아웃 기능을 제공하는 훅입니다.
 *
 * 기능:
 * - 서버에 로그아웃 API 요청 (토큰 무효화)
 * - localStorage에서 인증 정보 삭제
 * - React Query 캐시 초기화
 * - 로그인 페이지로 리다이렉트
 *
 * @returns logout 함수를 포함한 객체
 */
export function useLogout() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const logout = useCallback(async () => {
        const token = localStorage.getItem('auth_token');

        if (token) {
            try {
                await logoutApi(token);
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

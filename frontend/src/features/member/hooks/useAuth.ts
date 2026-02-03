import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';
import { getCurrentUsername, getValidToken } from '~/libs/jwt';
import { getUserApi } from '../api/memberApi';
import type { AuthUser, MemberResponseDTO } from '../types';

/**
 * localStorage 변경과 auth-change 커스텀 이벤트를 구독합니다.
 * 컴포넌트 언마운트 시 이벤트 리스너가 자동으로 정리됩니다.
 *
 * @param callback - 상태 변경 시 호출될 콜백 함수
 * @returns cleanup 함수 (이벤트 리스너 제거)
 */
function subscribeToStorage(callback: () => void) {
    window.addEventListener('storage', callback);
    window.addEventListener('auth-change', callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener('auth-change', callback);
    };
}

/**
 * 현재 유효한 인증 토큰을 반환합니다.
 * useSyncExternalStore의 getSnapshot 함수로 사용됩니다.
 *
 * @returns 유효한 토큰 또는 null
 */
function getSnapshot() {
    return getValidToken();
}

/**
 * 사용자 인증 상태를 관리하는 훅입니다.
 *
 * 기능:
 * - localStorage의 토큰 변경 감지 (다른 탭에서의 변경 포함)
 * - auth-change 커스텀 이벤트 구독 (로그인/로그아웃 시 발생)
 * - 인증된 사용자 정보 조회 (React Query 캐싱)
 *
 * @returns 인증 상태 및 사용자 정보
 * - data: AuthUser | undefined - 인증된 사용자 정보
 * - isAuthenticated: boolean - 인증 여부
 * - invalidateAuth: () => void - 인증 캐시 무효화 함수
 * - 기타 React Query 반환값 (isLoading, error 등)
 */
export function useAuth() {
    const queryClient = useQueryClient();

    const token = useSyncExternalStore(subscribeToStorage, getSnapshot);
    const username = token ? getCurrentUsername() : null;

    const invalidateAuth = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['auth'] });
    }, [queryClient]);

    const query = useQuery<AuthUser>({
        queryKey: ['auth', username],
        queryFn: async () => {
            if (!username) {
                throw new Error('Not authenticated');
            }
            const data: MemberResponseDTO = await getUserApi(username);
            return {
                ...data,
                isHost: data.role === 'HOST',
            };
        },
        retry: false,
        enabled: !!username,
        staleTime: 5 * 60 * 1000,
    });

    return {
        ...query,
        isAuthenticated: !!token && !!username,
        invalidateAuth,
    };
}

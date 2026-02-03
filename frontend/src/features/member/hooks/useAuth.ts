import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';
import { getCurrentUsername, getValidToken } from '~/libs/jwt';
import { getUserApi } from '../api/memberApi';
import { subscribeAuthChange } from '../utils/authEvent';
import type { AuthUser, MemberResponseDTO } from '../types';

function getTokenSnapshot() {
    return getValidToken();
}

function getServerTokenSnapshot() {
    return null;
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
 */
export function useAuth() {
    const queryClient = useQueryClient();
    const token = useSyncExternalStore(subscribeAuthChange, getTokenSnapshot, getServerTokenSnapshot);
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

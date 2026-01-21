import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useCallback, useSyncExternalStore} from 'react';
import {httpClient} from '~/libs/httpClient';
import {MemberResponseDTO} from '~/types/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface AuthUser extends MemberResponseDTO {
    isHost: boolean;
}

/**
 * 로컬 스토리지의 인증 관련 변경 사항을 구독하는 함수입니다.
 * 'storage' 이벤트와 'auth-change' 커스텀 이벤트를 감지합니다.
 * * @param {() => void} callback - 상태 변경 시 실행될 콜백 함수
 * @returns {() => void} 구독 해제 함수
 */
function subscribeToAuthChange(callback: () => void) {
    window.addEventListener('storage', callback);
    window.addEventListener('auth-change', callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener('auth-change', callback);
    };
}

/**
 * 로컬 스토리지에서 현재 로그인한 사용자의 식별자(username)를 가져옵니다.
 * 실제 인증 토큰은 HttpOnly 쿠키에 저장되므로, 여기서는 식별 용도로만 사용합니다.
 * * @returns {string | null} 저장된 username 또는 null
 */
function getUsername() {
    return localStorage.getItem('username');
}

export function useAuth() {
    const queryClient = useQueryClient();

    const username = useSyncExternalStore(subscribeToAuthChange, getUsername);

    const invalidateAuth = useCallback(() => {
        queryClient.invalidateQueries({queryKey: ['auth']});
    }, [queryClient]);

    const query = useQuery<AuthUser>({
        queryKey: ['auth', username],
        queryFn: async () => {
            if (!username) {
                throw new Error('Not authenticated');
            }
            // HTTP 요청 시 쿠키 자동 포함
            const data = await httpClient<MemberResponseDTO>(`${API_URL}/members/v1/${encodeURIComponent(username)}`);
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
        isAuthenticated: !!username && !!query.data,
        invalidateAuth,
    };
}

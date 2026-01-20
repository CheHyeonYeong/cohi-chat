import {useQuery, useQueryClient} from '@tanstack/react-query';
import {useCallback, useSyncExternalStore} from 'react';
import {httpClient} from '~/libs/httpClient';
import {getCurrentUsername, getValidToken} from '~/libs/jwt';
import {MemberResponseDTO} from '~/types/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface AuthUser extends MemberResponseDTO {
    isHost: boolean;
}

// localStorage 변경을 구독하는 함수
function subscribeToStorage(callback: () => void) {
    window.addEventListener('storage', callback);
    // 커스텀 이벤트도 구독 (같은 탭에서의 변경 감지용)
    window.addEventListener('auth-change', callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener('auth-change', callback);
    };
}

function getSnapshot() {
    return getValidToken();
}

export function useAuth() {
    const queryClient = useQueryClient();

    const token = useSyncExternalStore(subscribeToStorage, getSnapshot);
    const username = token ? getCurrentUsername() : null;

    const invalidateAuth = useCallback(() => {
        queryClient.invalidateQueries({queryKey: ['auth']});
    }, [queryClient]);

    const query = useQuery<AuthUser>({
        queryKey: ['auth', username],
        queryFn: async () => {
            if (!username) {
                throw new Error('Not authenticated');
            }
            const data = await httpClient<MemberResponseDTO>(`${API_URL}/members/v1/${encodeURIComponent(username)}`);
            return {
                ...data,
                isHost: data.role === 'HOST',
            };
        },
        retry: false,
        enabled: !!username,
        staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    });

    return {
        ...query,
        isAuthenticated: !!token && !!username,
        invalidateAuth,
    };
}

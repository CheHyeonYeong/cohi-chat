import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';
import { getCurrentUsername, getValidToken } from '~/libs/jwt';
import { getUserApi } from '../api/memberApi';
import type { AuthUser, MemberResponseDTO } from '../types';

function subscribeToStorage(callback: () => void) {
    window.addEventListener('storage', callback);
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

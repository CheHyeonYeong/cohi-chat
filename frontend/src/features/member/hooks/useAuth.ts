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

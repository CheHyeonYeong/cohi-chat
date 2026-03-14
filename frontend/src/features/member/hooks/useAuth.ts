import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useSyncExternalStore } from 'react';
import { getUserApi } from '../api/memberApi';
import { clearAuthenticatedUser, getStoredUsername } from '../utils/authStorage';
import { subscribeAuthChange } from '../utils/authEvent';
import type { AuthUser, MemberResponseDTO } from '../types';

function getUsernameSnapshot() {
    return getStoredUsername();
}

function getServerUsernameSnapshot() {
    return null;
}

export function useAuth() {
    const queryClient = useQueryClient();
    const username = useSyncExternalStore(
        subscribeAuthChange,
        getUsernameSnapshot,
        getServerUsernameSnapshot,
    );

    const invalidateAuth = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['auth'] });
    }, [queryClient]);

    const query = useQuery<AuthUser>({
        queryKey: ['auth', username],
        queryFn: async () => {
            if (!username) {
                throw new Error('Not authenticated');
            }
            try {
                const data: MemberResponseDTO = await getUserApi(username);
                return {
                    ...data,
                    isHost: data.role === 'HOST',
                };
            } catch (error) {
                if (error instanceof Error && (error.cause === 401 || error.cause === 403)) {
                    clearAuthenticatedUser();
                }
                throw error;
            }
        },
        retry: false,
        enabled: !!username,
        staleTime: 5 * 60 * 1000,
    });

    return {
        ...query,
        isAuthenticated: !!username,
        invalidateAuth,
    };
}

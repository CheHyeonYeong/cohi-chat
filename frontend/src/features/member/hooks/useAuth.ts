import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
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
    const username = useSyncExternalStore(
        subscribeAuthChange,
        getUsernameSnapshot,
        getServerUsernameSnapshot,
    );

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

    // queryFn 안에서 부수효과를 일으키면 리패치 시마다 호출될 수 있으므로 useEffect로 분리
    useEffect(() => {
        if (
            query.error instanceof Error &&
            typeof query.error.cause === 'number' &&
            (query.error.cause === 401 || query.error.cause === 403) &&
            username !== null
        ) {
            clearAuthenticatedUser();
        }
    }, [query.error, username]);

    return {
        ...query,
        isAuthenticated: !!username,
    };
}

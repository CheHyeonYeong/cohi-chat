import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUserApi } from '../api/memberApi';
import { subscribeAuthChange } from '../utils/authEvent';
import type { AuthUser, MemberResponseDTO } from '../types';

export function useAuth() {
    const queryClient = useQueryClient();

    const query = useQuery<AuthUser>({
        queryKey: ['auth'],
        queryFn: async () => {
            const data: MemberResponseDTO = await getCurrentUserApi();
            return {
                ...data,
                isHost: data.role === 'HOST',
            };
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        return subscribeAuthChange(() => {
            void queryClient.invalidateQueries({ queryKey: ['auth'] });
        });
    }, [queryClient]);

    return {
        ...query,
        username: query.data?.username ?? null,
        isAuthenticated: !!query.data,
    };
}

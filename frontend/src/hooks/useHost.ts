import {useQuery} from '@tanstack/react-query';
import {httpClient} from '~/libs/httpClient';
import type { MemberResponseDTO } from '~/features/member';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export function useHosts() {
    return useQuery<MemberResponseDTO[]>({
        queryKey: ['hosts'],
        queryFn: async () => {
            const response = await httpClient<MemberResponseDTO[]>(`${API_URL}/members/v1/hosts`);
            if (!response) {
                throw new Error('Failed to fetch hosts');
            }
            return response;
        },
        retry: false,
    });
}

export function useHost(username: string) {
    const { data: hosts, ...rest } = useHosts();
    const host = hosts?.find((h) => h.username === username) ?? null;
    return { data: host, ...rest };
}


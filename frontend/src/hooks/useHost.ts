import {useQuery} from '@tanstack/react-query';
import {httpClient} from '~/libs/httpClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface HostDTO {
    username: string;
    displayName: string;
}

export function useHosts() {
    return useQuery<HostDTO[]>({
        queryKey: ['hosts'],
        queryFn: async () => {
            const response = await httpClient<HostDTO[]>(`${API_URL}/members/v1/hosts`);
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


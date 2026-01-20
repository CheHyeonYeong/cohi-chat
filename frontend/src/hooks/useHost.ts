import {useQuery} from '@tanstack/react-query';
import {httpClient} from '~/libs/httpClient';
import {MemberResponseDTO} from '~/types/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useHosts() {
    return useQuery<MemberResponseDTO[]>({
        queryKey: ['hosts'],
        queryFn: async () => {
            const response = await httpClient<MemberResponseDTO[]>(`${API_URL}/account/hosts`);
            if (!response) {
                throw new Error('Failed to fetch hosts');
            }
            return response;
        },
        retry: false,
    });
}


import { useQuery } from '@tanstack/react-query';
import type { HostResponseDTO } from '~/features/member';
import { useHosts } from '~/hooks/useHost';
import { searchHosts } from '../api';
import { hostKeys } from './queryKeys';

export const useHostSearch = (query: string) => {
    const trimmedQuery = query.trim();

    return useQuery<HostResponseDTO[]>({
        queryKey: hostKeys.search(trimmedQuery),
        queryFn: () => searchHosts(trimmedQuery),
        enabled: trimmedQuery.length > 0,
        retry: false,
    });
};

export const useHostDirectory = (query: string) => {
    const trimmedQuery = query.trim();
    const hostsQuery = useHosts(trimmedQuery.length === 0);
    const searchQuery = useHostSearch(trimmedQuery);

    return trimmedQuery.length > 0 ? searchQuery : hostsQuery;
};

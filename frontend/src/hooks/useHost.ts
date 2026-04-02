import { useQuery } from '@tanstack/react-query';
import { getHosts } from '~/features/host/api';
import type { HostResponseDTO } from '~/features/member';

export const useHosts = (enabled = true) => useQuery<HostResponseDTO[]>({
    queryKey: ['hosts'],
    queryFn: getHosts,
    retry: false,
    enabled,
});

export const useHost = (username: string) => {
    const { data: hosts, ...rest } = useHosts(!!username);
    const host = hosts?.find((h) => h.username === username) ?? null;
    return { data: host, ...rest };
};

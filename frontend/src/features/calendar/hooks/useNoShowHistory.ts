import { useQuery } from '@tanstack/react-query';
import { getNoShowHistory } from '../api';
import type { INoShowHistoryItem } from '../types';
import { calendarKeys } from './queryKeys';

export function useNoShowHistory(hostId?: string) {
    return useQuery<INoShowHistoryItem[]>({
        queryKey: calendarKeys.noShowHistory(hostId!),
        queryFn: () => getNoShowHistory(hostId!),
        enabled: !!hostId,
    });
}

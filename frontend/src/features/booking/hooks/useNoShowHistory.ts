import { useQuery } from '@tanstack/react-query';
import { getNoShowHistory } from '../api';
import type { INoShowHistoryItem } from '../types';
import { bookingKeys } from './queryKeys';

export const useNoShowHistory = (hostId?: string) => useQuery<INoShowHistoryItem[]>({
    queryKey: bookingKeys.noShowHistory(hostId!),
    queryFn: () => getNoShowHistory(hostId!),
    enabled: !!hostId,
});

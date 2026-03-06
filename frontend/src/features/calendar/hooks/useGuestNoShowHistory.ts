import { useQuery } from '@tanstack/react-query';
import { getGuestNoShowHistory } from '../api/bookings';
import type { IGuestNoShowHistoryItem } from '../types';
import { calendarKeys } from './queryKeys';

export function useGuestNoShowHistory(guestId?: string) {
    return useQuery<IGuestNoShowHistoryItem[]>({
        queryKey: calendarKeys.guestNoShowHistory(guestId!),
        queryFn: () => getGuestNoShowHistory(guestId!),
        enabled: !!guestId,
    });
}

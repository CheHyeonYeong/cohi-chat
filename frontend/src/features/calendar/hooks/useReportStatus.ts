import { useQuery } from '@tanstack/react-query';
import { getReportStatus } from '../api/bookings';
import { calendarKeys } from './queryKeys';

export function useReportStatus(bookingId: number) {
    return useQuery({
        queryKey: [...calendarKeys.booking(bookingId), 'report-status'],
        queryFn: () => getReportStatus(bookingId),
        staleTime: 5 * 60 * 1000,
    });
}

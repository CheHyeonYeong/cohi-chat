import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportGuest } from '../api/bookings';
import { calendarKeys } from './queryKeys';

export function useReportGuest(bookingId: number, guestId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (reason?: string) => reportGuest(bookingId, reason),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: [...calendarKeys.booking(bookingId), 'report-status'] }),
                queryClient.invalidateQueries({ queryKey: calendarKeys.booking(bookingId) }),
                queryClient.invalidateQueries({ queryKey: calendarKeys.myBookingsAll() }),
                ...(guestId
                    ? [queryClient.invalidateQueries({ queryKey: calendarKeys.guestNoShowHistory(guestId) })]
                    : []),
            ]);
        },
    });
}

/** @deprecated use useReportGuest */
export const useReportGuestNoShow = useReportGuest;

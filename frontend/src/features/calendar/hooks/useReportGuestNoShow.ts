import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportGuestNoShow } from '../api/bookings';
import { calendarKeys } from './queryKeys';

export function useReportGuestNoShow(bookingId: number, guestId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (reason?: string) => reportGuestNoShow(bookingId, reason),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: calendarKeys.booking(bookingId) }),
                queryClient.invalidateQueries({ queryKey: calendarKeys.myBookingsAll() }),
                ...(guestId
                    ? [queryClient.invalidateQueries({ queryKey: calendarKeys.guestNoShowHistory(guestId) })]
                    : []),
            ]);
        },
    });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportHostNoShow } from '../api/bookings';
import { calendarKeys } from './queryKeys';

export function useReportHostNoShow(bookingId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (reason?: string) => reportHostNoShow(bookingId, reason),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: calendarKeys.booking(bookingId) }),
                queryClient.invalidateQueries({ queryKey: calendarKeys.myBookings() }),
            ]);
        },
    });
}

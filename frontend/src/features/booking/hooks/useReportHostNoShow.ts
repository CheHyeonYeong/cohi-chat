import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportHostNoShow } from '../api/bookings';
import { bookingKeys } from './queryKeys';

export function useReportHostNoShow(bookingId: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (reason?: string) => reportHostNoShow(bookingId, reason),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: bookingKeys.booking(bookingId) }),
                queryClient.invalidateQueries({ queryKey: bookingKeys.myBookingsAll() }),
            ]);
        },
    });
}

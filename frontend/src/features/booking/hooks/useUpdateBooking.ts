import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBooking } from '../api/updateBooking';
import { bookingKeys } from './queryKeys';
import type { IBookingDetail, IBookingUpdatePayload } from '../types';

export function useUpdateBooking(bookingId: number) {
    const queryClient = useQueryClient();
    return useMutation<IBookingDetail, Error, IBookingUpdatePayload>({
        mutationFn: (data) => updateBooking(bookingId, data),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: bookingKeys.booking(bookingId) }),
                queryClient.invalidateQueries({ queryKey: bookingKeys.myBookingsAll() }),
                queryClient.invalidateQueries({ queryKey: bookingKeys.allMyBookingsAll() }),
            ]);
        },
    });
}

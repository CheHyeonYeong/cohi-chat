import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { createBooking } from '../api';
import type { IBookingDetail, IBookingPayload } from '../types';
import { bookingKeys, calendarKeys } from './queryKeys';

export const useCreateBooking = (slug: string, year: number, month: number): UseMutationResult<IBookingDetail, Error, IBookingPayload> => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation<IBookingDetail, Error, IBookingPayload>({
        mutationFn: (bookingData: IBookingPayload) => createBooking(slug, bookingData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: calendarKeys.bookings(year, month) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.myBookingsAll() });
            navigate({
                to: '/host/$hostId',
                params: { hostId: slug },
            });
        },
    });
};

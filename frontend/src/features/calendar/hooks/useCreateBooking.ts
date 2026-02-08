import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { createBooking } from '../api';
import type { IBookingDetail, IBookingPayload } from '../types';
import { calendarKeys } from './queryKeys';

export function useCreateBooking(slug: string, year: number, month: number): UseMutationResult<IBookingDetail, Error, IBookingPayload> {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    return useMutation<IBookingDetail, Error, IBookingPayload>({
        mutationFn: (bookingData: IBookingPayload) => createBooking(slug, bookingData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: calendarKeys.bookings(year, month) });
            queryClient.invalidateQueries({ queryKey: calendarKeys.myBookings() });
            navigate({
                to: '/app/calendar/$slug',
                params: { slug },
                search: { year, month },
            });
        },
        onError: (error: Error) => {
            console.error('Error creating booking:', error.message);
        },
    });
}

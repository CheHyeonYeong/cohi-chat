import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { createBooking } from '../api';
import type { IBookingDetail, IBookingPayload } from '../types';

export function useCreateBooking(slug: string, year: number, month: number): UseMutationResult<IBookingDetail, Error, IBookingPayload> {
    const navigate = useNavigate();

    return useMutation<IBookingDetail, Error, IBookingPayload>({
        mutationFn: (bookingData: IBookingPayload) => createBooking(slug, bookingData),
        onSuccess: () => {
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

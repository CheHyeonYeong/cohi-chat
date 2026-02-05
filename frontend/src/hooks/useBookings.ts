import { useMutation, useQuery } from '@tanstack/react-query';
import { getBooking, getMyBookingsAsGuest, uploadBookingFile } from '~/libs/bookings';
import { IBookingResponse } from '~/types/booking';


export function useMyBookings() {
    return useQuery<IBookingResponse[]>({
        queryKey: ['my-bookings'],
        queryFn: async () => {
            return await getMyBookingsAsGuest();
        },
    });
}

export function useBooking(id: number) {
    return useQuery<IBookingResponse>({
        queryKey: ['booking', id],
        queryFn: async () => {
            return await getBooking(id);
        },
    });
}

export function useUploadBookingFile(id: number) {
    return useMutation<unknown, Error, FormData>({
        mutationFn: async (file: FormData) => {
            return await uploadBookingFile(id, file);
        },
    });
}
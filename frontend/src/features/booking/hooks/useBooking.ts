import { useMutation, useQuery } from '@tanstack/react-query';
import { getBooking, getMyBookings, uploadBookingFileWithPresignedUrl, deleteBookingFile } from '../api';
import type { IBookingDetail, IBookingFile, IPaginatedBookingDetail } from '../types';
import { bookingKeys } from './queryKeys';

export function useMyBookings({ page, pageSize }: { page?: number; pageSize?: number }) {
    return useQuery<IPaginatedBookingDetail>({
        queryKey: bookingKeys.myBookings(page, pageSize),
        queryFn: () => getMyBookings({ page, pageSize }),
    });
}

export function useBooking(id: number | null) {
    return useQuery<IBookingDetail>({
        queryKey: bookingKeys.booking(id ?? 0),
        queryFn: () => getBooking(id!),
        enabled: id !== null,
    });
}

export function useUploadBookingFile(id: number) {
    return useMutation<IBookingFile, Error, File>({
        mutationFn: (file: File) => uploadBookingFileWithPresignedUrl(id, file),
    });
}

export function useDeleteBookingFile(bookingId: number) {
    return useMutation<void, Error, number>({
        mutationFn: (fileId: number) => deleteBookingFile(bookingId, fileId),
    });
}

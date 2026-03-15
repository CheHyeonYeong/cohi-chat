import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '~/features/member/hooks/useAuth';
import { getBooking, getMyBookings, uploadBookingFileWithPresignedUrl, deleteBookingFile } from '../api';
import type { IBookingDetail, IBookingFile, IPaginatedBookingDetail } from '../types';
import { bookingKeys } from './queryKeys';

export function useMyBookings({ page, pageSize }: { page?: number; pageSize?: number }) {
    const { username, isAuthenticated } = useAuth();

    return useQuery<IPaginatedBookingDetail>({
        queryKey: bookingKeys.myBookings(page, pageSize, username),
        queryFn: () => getMyBookings({ page, pageSize }),
        enabled: isAuthenticated && !!username,
    });
}

export function useBooking(id: number | null) {
    const { username, isAuthenticated } = useAuth();

    return useQuery<IBookingDetail>({
        queryKey: bookingKeys.booking(id ?? 0, username),
        queryFn: () => getBooking(id!),
        enabled: id !== null && isAuthenticated && !!username,
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

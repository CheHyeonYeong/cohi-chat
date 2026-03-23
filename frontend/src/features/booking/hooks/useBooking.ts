import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '~/features/member/hooks/useAuth';
import { getBooking, getMyBookings, getAllMyBookings, uploadBookingFileWithPresignedUrl, deleteBookingFile } from '../api';
import type { IBookingDetail, IBookingFile, IPaginatedBookingDetail, IPaginatedBookingWithRole } from '../types';
import { bookingKeys } from './queryKeys';

export const useMyBookings = ({ page, pageSize }: { page?: number; pageSize?: number }) => {
    const { username, isAuthenticated } = useAuth();

    return useQuery<IPaginatedBookingDetail>({
        queryKey: bookingKeys.myBookings(page, pageSize, username ?? ''),
        queryFn: () => getMyBookings({ page, pageSize }),
        enabled: isAuthenticated,
    });
};

export const useAllMyBookings = ({ page, pageSize }: { page?: number; pageSize?: number }) => useQuery<IPaginatedBookingWithRole>({
    queryKey: bookingKeys.allMyBookings(page, pageSize),
    queryFn: () => getAllMyBookings({ page, pageSize }),
});

export const useBooking = (id: number | null) => {
    const { username, isAuthenticated } = useAuth();

    return useQuery<IBookingDetail>({
        queryKey: bookingKeys.booking(id ?? 0, username),
        queryFn: () => getBooking(id!),
        enabled: id !== null && isAuthenticated,
        placeholderData: keepPreviousData,
    });
};

export const useUploadBookingFile = (id: number) => useMutation<IBookingFile, Error, File>({
    mutationFn: (file: File) => uploadBookingFileWithPresignedUrl(id, file),
});

export const useDeleteBookingFile = (bookingId: number) => useMutation<void, Error, number>({
    mutationFn: (fileId: number) => deleteBookingFile(bookingId, fileId),
});

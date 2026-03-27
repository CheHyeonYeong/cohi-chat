import { useMutation } from '@tanstack/react-query';
import { downloadFileWithPresignedUrl } from '../api';

interface DownloadBookingFileParams {
    fileId: number;
    fileName: string;
}

export const useDownloadBookingFile = (bookingId: number) => useMutation<void, Error, DownloadBookingFileParams>({
    mutationFn: ({ fileId, fileName }) => downloadFileWithPresignedUrl(bookingId, fileId, fileName),
});

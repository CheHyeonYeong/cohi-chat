import { useMutation } from '@tanstack/react-query';
import { downloadFileWithPresignedUrl } from '../api';

interface DownloadBookingFileParams {
    fileId: number;
    fileName: string;
}

export function useDownloadBookingFile(bookingId: number) {
    return useMutation<void, Error, DownloadBookingFileParams>({
        mutationFn: ({ fileId, fileName }) => downloadFileWithPresignedUrl(bookingId, fileId, fileName),
    });
}

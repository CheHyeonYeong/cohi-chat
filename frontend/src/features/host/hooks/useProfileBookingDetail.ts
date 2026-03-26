import { useBooking, useUploadBookingFile, useDeleteBookingFile, useDownloadBookingFile } from '~/features/booking';
import { useToast } from '~/components/toast/useToast';
import { getErrorMessage } from '~/libs/errorUtils';

interface UseProfileBookingDetailOptions {
    selectedBookingId: number | undefined;
    enabled: boolean;
    onRefetchBookings?: () => void;
}

export const useProfileBookingDetail = ({ selectedBookingId, enabled, onRefetchBookings }: UseProfileBookingDetailOptions) => {
    const { showToast } = useToast();
    const bookingId = selectedBookingId ?? 0;

    const { data: selectedBooking, refetch: refetchSelectedBooking } = useBooking(
        enabled ? (selectedBookingId ?? null) : null
    );

    const { mutateAsync: uploadFileAsync, isPending: isUploading, error: uploadError, reset: resetUploadError } = useUploadBookingFile(bookingId);
    const { mutateAsync: deleteFileAsync, isPending: isDeleting } = useDeleteBookingFile(bookingId);
    const { mutate: downloadFile } = useDownloadBookingFile(bookingId);

    const handleUpload = async (files: FileList) => {
        if (!selectedBookingId) return;
        resetUploadError();
        try {
            for (const file of files) {
                await uploadFileAsync(file);
            }
            await Promise.all([refetchSelectedBooking(), onRefetchBookings?.()]);
        } catch {
            // 파일 선택 유지하여 사용자가 다른 파일로 재시도 가능
        }
    };

    const handleDownload = (fileId: number, fileName: string) => {
        if (!selectedBookingId) return;
        downloadFile({ fileId, fileName });
    };

    const handleDelete = async (fileId: number) => {
        if (!selectedBookingId) return;
        try {
            await deleteFileAsync(fileId);
            await refetchSelectedBooking();
        } catch (err) {
            showToast(getErrorMessage(err, '파일 삭제 실패'), 'profile-preview-delete-error');
        }
    };

    return {
        selectedBooking,
        isUploading,
        isDeleting,
        uploadError,
        handleUpload,
        handleDownload,
        handleDelete,
    };
};

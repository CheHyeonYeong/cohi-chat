import { Link, useParams } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Button } from "~/components/button";
import { useBooking, useUploadBookingFile } from "~/features/calendar";
import {
    validateFiles,
    getAcceptedFileTypes,
    formatFileSize,
    FILE_UPLOAD_LIMITS,
    type FileValidationError,
} from "~/libs/fileValidation";
import { getErrorMessage } from "~/libs/errorUtils";
import { getValidToken } from "~/libs/jwt";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export default function Booking() {
    const { id } = useParams({ from: '/app/booking/$id' });
    const { data: booking, isLoading, error, refetch } = useBooking(id);
    const { mutateAsync: uploadFileAsync, isPending: isUploading, error: uploadError } = useUploadBookingFile(id);
    const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    if (!booking || isLoading) return (
        <div className="min-h-screen bg-[var(--cohe-bg-light)] py-8">
            <div className="w-full max-w-4xl mx-auto px-8">
                예약 정보를 불러오고 있습니다...
            </div>
        </div>
    );
    if (error) return (
        <div className="min-h-screen bg-[var(--cohe-bg-light)] py-8">
            <div className="w-full max-w-4xl mx-auto px-8">
                {getErrorMessage(error, '예약 정보를 불러오는 중 오류가 발생했습니다.')}
            </div>
        </div>
    );

    const when = new Date(booking.when);
    const existingFilesCount = booking.files.length;
    const existingTotalSize = booking.files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
    const canUploadMore = existingFilesCount < FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            setSelectedFiles([]);
            setValidationErrors([]);
            return;
        }

        const result = validateFiles(files, existingFilesCount, existingTotalSize);
        setValidationErrors(result.errors);
        setSelectedFiles(Array.from(files));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (validationErrors.length > 0 || selectedFiles.length === 0) {
            return;
        }

        // mutateAsync를 사용하여 순차 업로드
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            setUploadProgress(`${i + 1}/${selectedFiles.length} 업로드 중...`);
            const formData = new FormData();
            formData.append('file', file);
            await uploadFileAsync(formData);
        }

        // 모든 업로드 완료 후 정리
        setUploadProgress('');
        setSelectedFiles([]);
        setValidationErrors([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        refetch();
    };

    const handleDownload = async (fileId: number, fileName: string) => {
        try {
            setDownloadError(null);
            const token = getValidToken();
            const response = await fetch(`${API_URL}/bookings/${id}/files/${fileId}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('다운로드에 실패했습니다.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            setDownloadError(getErrorMessage(err, '파일 다운로드에 실패했습니다.'));
        }
    };

    return (
        <div className="min-h-screen bg-[var(--cohe-bg-light)] py-8">
            <div className="w-full max-w-4xl mx-auto px-8 flex flex-col space-y-4">
                <Link to='/app/my-bookings' className='inline-block w-fit bg-gray-500 hover:bg-gray-700 hover:text-white text-white px-4 py-2 rounded-md'>내 예약 목록으로</Link>

                <h1 className="text-2xl font-bold">{booking.host.displayName}님과 약속잡기</h1>

                <div className="flex flex-row space-x-2 items-center">
                    <div>{booking.topic}</div>
                    <div className="text-sm text-gray-500 flex flex-row items-center space-x-2">
                        <div>{when.getFullYear()}년 {when.getMonth() + 1}월 {when.getDate()}일</div>
                        <div>{booking.timeSlot.startTime} - {booking.timeSlot.endTime}</div>
                    </div>
                </div>

                <div className="flex flex-row space-x-2 items-center">
                    {booking.description}
                </div>

                <hr className="w-full" />

                <div className="bg-gray-50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2">파일 첨부</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        허용 형식: {FILE_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.join(', ')} |
                        최대 크기: {formatFileSize(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE)} |
                        최대 개수: {FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING}개
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                        현재 첨부 파일: {existingFilesCount}개 / {FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING}개,
                        총 용량: {formatFileSize(existingTotalSize)} / {formatFileSize(FILE_UPLOAD_LIMITS.MAX_TOTAL_SIZE_PER_BOOKING)}
                    </p>

                    {!canUploadMore && (
                        <p className="text-red-600 text-sm mb-4">
                            최대 파일 개수에 도달했습니다. 새 파일을 첨부하려면 기존 파일을 삭제해주세요.
                        </p>
                    )}

                    {canUploadMore && (
                        <form className="flex flex-col space-y-2 items-start" onSubmit={handleSubmit}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                name="files"
                                multiple
                                accept={getAcceptedFileTypes()}
                                onChange={handleFileChange}
                                className="w-full"
                            />

                            {validationErrors.length > 0 && (
                                <div className="w-full bg-red-50 border border-red-200 rounded p-3">
                                    <p className="text-red-700 font-medium text-sm">파일 업로드 오류:</p>
                                    <ul className="list-disc pl-4 text-red-600 text-sm mt-1">
                                        {validationErrors.map((err, idx) => (
                                            <li key={idx}>{err.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {uploadError && (
                                <div className="w-full bg-red-50 border border-red-200 rounded p-3">
                                    <p className="text-red-600 text-sm">
                                        업로드 실패: {getErrorMessage(uploadError, '파일 업로드에 실패했습니다.')}
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full py-2"
                                disabled={validationErrors.length > 0 || selectedFiles.length === 0 || isUploading}
                            >
                                {isUploading ? (uploadProgress || '업로드 중...') : '첨부'}
                            </Button>
                        </form>
                    )}
                </div>

                {downloadError && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-red-600 text-sm">{downloadError}</p>
                    </div>
                )}

                {booking.files.length > 0 && (
                    <div className="bg-white border rounded-lg p-4">
                        <h3 className="font-medium mb-3">첨부된 파일</h3>
                        <ul className="space-y-2">
                            {booking.files.map((file) => (
                                <li key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                    <button
                                        type="button"
                                        onClick={() => handleDownload(file.id, file.originalFileName || file.file.split('/').pop() || 'download')}
                                        className="text-blue-600 hover:underline flex-1 truncate text-left"
                                    >
                                        {file.originalFileName || file.file.split('/').pop()}
                                    </button>
                                    <span className="text-sm text-gray-500 ml-2">
                                        {file.fileSize ? formatFileSize(file.fileSize) : ''}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {booking.files.length === 0 && (
                    <div>첨부 파일이 없습니다.</div>
                )}
            </div>
        </div>
    );
}

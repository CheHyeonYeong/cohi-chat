import { Link, useParams } from "@tanstack/react-router";
import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "~/components/button";
import { useBooking, useUploadBookingFile, useReportHostNoShow, useNoShowHistory } from "~/features/calendar";
import type { AttendanceStatus } from "~/features/calendar";
import { useAuth } from "~/features/member";
import {
    validateFiles,
    getAcceptedFileTypes,
    formatFileSize,
    FILE_UPLOAD_LIMITS,
    type FileValidationError,
} from "~/libs/fileValidation";
import { getValidToken } from "~/libs/jwt";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const STATUS_LABELS: Record<AttendanceStatus, string> = {
    SCHEDULED: '예약됨',
    ATTENDED: '참석',
    NO_SHOW: '게스트 노쇼',
    HOST_NO_SHOW: '호스트 노쇼 신고됨',
    CANCELLED: '취소됨',
    SAME_DAY_CANCEL: '당일 취소',
    LATE: '지각',
};

export default function Booking() {
    const { id } = useParams({ from: '/booking/$id' });
    const { data: booking, isLoading, error, refetch } = useBooking(id);
    const { data: currentUser } = useAuth();
    const { mutateAsync: uploadFileAsync, isPending: isUploading, error: uploadError } = useUploadBookingFile(id);
    const { mutate: reportNoShow, isPending: isReporting, error: reportError, reset: resetReport } = useReportHostNoShow(Number(id));
    const { data: noShowHistory } = useNoShowHistory(booking?.hostId ?? undefined);
    const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30_000);
        return () => clearInterval(timer);
    }, []);

    const isMeetingStarted = useMemo(() => {
        if (!booking) return false;
        const [h, m] = booking.timeSlot.startTime.split(':').map(Number);
        // 로컬 날짜 기준으로 생성하여 UTC 파싱으로 인한 날짜 오차 방지
        const meetingStart = new Date(
            booking.when.getFullYear(),
            booking.when.getMonth(),
            booking.when.getDate(),
            h, m, 0, 0
        );
        return now >= meetingStart.getTime();
    }, [booking, now]);

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
                예약 정보를 불러오는 중 오류가 발생했습니다.
            </div>
        </div>
    );

    const when = new Date(booking.when);
    const existingFilesCount = booking.files.length;
    const existingTotalSize = booking.files.reduce((sum, f) => sum + (f.fileSize || 0), 0);
    const canUploadMore = existingFilesCount < FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING;

    // 현재 사용자가 이 예약의 게스트인지 판단 (guestId 기준, 단순 호스트 비교 방지)
    const isGuest = !!currentUser && currentUser.id === booking.guestId;
    const canReport = isGuest && booking.attendanceStatus === 'SCHEDULED' && isMeetingStarted;

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
            alert('파일 다운로드에 실패했습니다.');
        }
    };

    const handleReportSubmit = () => {
        reportNoShow(reportReason || undefined, {
            onSuccess: () => {
                setShowReportForm(false);
                setReportReason('');
            },
        });
    };

    return (
        <div className="min-h-screen bg-[var(--cohe-bg-light)] py-8">
            <div className="w-full max-w-4xl mx-auto px-8 flex flex-col space-y-4">
                <Link to='/my-bookings' className='inline-block w-fit bg-gray-500 hover:bg-gray-700 hover:text-white text-white px-4 py-2 rounded-md'>내 예약 목록으로</Link>

                <h1 className="text-2xl font-bold">{booking.host.displayName}님과 약속잡기</h1>

                <div className="flex flex-row space-x-2 items-center">
                    <div>{booking.topic}</div>
                    <div className="text-sm text-gray-500 flex flex-row items-center space-x-2">
                        <div>{when.getFullYear()}년 {when.getMonth() + 1}월 {when.getDate()}일</div>
                        <div>{booking.timeSlot.startTime} - {booking.timeSlot.endTime}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {STATUS_LABELS[booking.attendanceStatus] ?? booking.attendanceStatus}
                    </span>
                </div>

                <div className="flex flex-row space-x-2 items-center">
                    {booking.description}
                </div>

                <hr className="w-full" />

                {canReport && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-2">호스트 노쇼 신고</h2>
                        {!showReportForm ? (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setShowReportForm(true)}
                            >
                                호스트 노쇼 신고
                            </Button>
                        ) : (
                            <div className="flex flex-col space-y-2">
                                <textarea
                                    className="w-full border border-gray-300 rounded p-2 text-sm resize-none"
                                    rows={3}
                                    placeholder="신고 사유를 입력해주세요 (선택)"
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                />
                                {reportError && (
                                    <p className="text-red-600 text-sm">{reportError.message}</p>
                                )}
                                <div className="flex flex-row space-x-2">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        loading={isReporting}
                                        onClick={handleReportSubmit}
                                    >
                                        신고하기
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setShowReportForm(false);
                                            setReportReason('');
                                            resetReport();
                                        }}
                                    >
                                        취소
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {isGuest && noShowHistory && noShowHistory.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-2 text-red-700">
                            이 호스트의 노쇼 이력 {noShowHistory.length}건
                        </h2>
                        <ul className="space-y-1">
                            {noShowHistory.map((item) => (
                                <li key={item.id} className="text-sm text-red-600">
                                    {item.bookingDate} — 노쇼 발생
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

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
                                        업로드 실패: {uploadError.message}
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={validationErrors.length > 0 || selectedFiles.length === 0 || isUploading}
                            >
                                {isUploading ? (uploadProgress || '업로드 중...') : '첨부'}
                            </Button>
                        </form>
                    )}
                </div>

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

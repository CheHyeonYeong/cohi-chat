import { useParams } from '@tanstack/react-router';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageLayout } from '~/components';
import { Button } from '~/components/button';
import { Card } from '~/components/card';
import { useBooking, useUploadBookingFile, useDeleteBookingFile, useReportHostNoShow, getPresignedDownloadUrl, BookingEditForm, BookingMetaSection, BookingHeader, BookingFileSection } from '~/features/booking';
import { useAuth } from '~/features/member';
import { useHostCalendar } from '~/features/host';

export function Detail() {
    const { id } = useParams({ from: '/booking/$id' });
    const { data: booking, isLoading, error, refetch } = useBooking(id);
    const { data: currentUser } = useAuth();
    const { mutateAsync: uploadFileAsync, isPending: isUploading, error: uploadError } = useUploadBookingFile(id);
    const { mutateAsync: deleteFileAsync, isPending: isDeleting } = useDeleteBookingFile(Number(id));
    const { mutate: reportNoShow, isPending: isReporting, error: reportError, reset: resetReport } = useReportHostNoShow(Number(id));
    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const { data: hostCalendar } = useHostCalendar(booking?.host.username ?? '');

    // Host no-show report state
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');

    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 10_000);
        return () => clearInterval(timer);
    }, []);

    const isMeetingStarted = useMemo(() => {
        if (!booking) return false;
        return now >= booking.startedAt.getTime();
    }, [booking, now]);

    // 현재 사용자가 이 예약의 게스트인지 판단
    const isGuest = !!currentUser && currentUser.id === booking?.guestId;
    const isAlreadyReported = booking?.attendanceStatus === 'HOST_NO_SHOW';
    const canEdit = isGuest && booking?.attendanceStatus === 'SCHEDULED' && !isEditing;

    const handleEditCancel = useCallback(() => setIsEditing(false), []);
    const handleEditSuccess = useCallback(() => setIsEditing(false), []);

    const handleUpload = async (files: FileList) => {
        for (const file of Array.from(files)) {
            await uploadFileAsync(file);
        }
        refetch();
    };

    const handleDownload = async (fileId: number, fileName: string) => {
        const { url } = await getPresignedDownloadUrl(Number(id), fileId);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleDelete = async (fileId: number) => {
        await deleteFileAsync(fileId);
        refetch();
    };

    const handleReportSubmit = () => {
        reportNoShow(reportReason || undefined, {
            onSuccess: () => {
                setShowReportForm(false);
                setReportReason('');
            },
        });
    };

    /* -- Loading / error states -------------------------------------------- */

    if (isLoading) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohi-bg-light)] flex items-center justify-center">
                <p className="text-gray-500">예약 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohi-bg-light)] flex items-center justify-center">
                <p className="text-red-500">예약 정보를 불러오는 중 오류가 발생했습니다.</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohi-bg-light)] flex items-center justify-center">
                <p className="text-gray-500">예약 정보를 찾을 수 없습니다.</p>
            </div>
        );
    }

    return (
        <PageLayout title="예약 상세" maxWidth="3xl" className="pb-16">
            <div className="space-y-6">
                {/* Booking info card */}
                <Card className="border border-gray-100 flex flex-col gap-6">
                    <BookingHeader
                            displayName={booking.host.displayName}
                            roleLabel="Host"
                            attendanceStatus={booking.attendanceStatus}
                            actions={
                                canEdit ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="text-xs font-medium text-[var(--cohi-primary)] hover:underline cursor-pointer"
                                        data-testid="booking-edit-button"
                                    >
                                        수정
                                    </button>
                                ) : undefined
                            }
                        />

                    <hr className="border-gray-100" />

                    {isEditing && hostCalendar ? (
                        <BookingEditForm
                            booking={booking}
                            topics={hostCalendar.topics}
                            onCancel={handleEditCancel}
                            onSuccess={handleEditSuccess}
                        />
                    ) : (
                        <BookingMetaSection booking={booking} />
                    )}

                    <hr className="border-gray-100" />

                    <BookingFileSection
                        files={booking.files}
                        onUpload={handleUpload}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        isUploading={isUploading}
                        isDeleting={isDeleting}
                        uploadError={uploadError}
                    />
                </Card>

                {/* Host No-show report section */}
                {isGuest && (
                    <Card className="bg-amber-50 border-amber-200">
                        <h2 className="mb-2 text-lg font-semibold text-amber-900">호스트 노쇼 신고</h2>
                        {isAlreadyReported ? (
                            <p className="text-sm text-amber-800">이미 신고한 예약입니다.</p>
                        ) : !showReportForm ? (
                            <div className="space-y-3">
                                <p className="text-sm text-amber-800">
                                    {isMeetingStarted
                                        ? '호스트가 약속 장소에 나타나지 않았나요? 신고를 통해 알려주세요.'
                                        : '미팅 시작 이후부터 신고할 수 있습니다.'}
                                </p>
                                <Button
                                    type="button"
                                    variant="primary"
                                    disabled={!isMeetingStarted}
                                    onClick={() => setShowReportForm(true)}

                                >
                                        호스트 노쇼 신고
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-3">
                                <textarea
                                    className="w-full border border-amber-200 rounded-xl p-3 text-sm resize-none focus:ring-amber-500 focus:border-amber-500"
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
                                        variant="outline"
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
                    </Card>
                )}

            </div>
        </PageLayout>
    );
}

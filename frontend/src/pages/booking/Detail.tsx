import { useParams } from '@tanstack/react-router';
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    type DragEndEvent,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageLayout } from '~/components';
import { Button } from '~/components/button';
import { Card } from '~/components/card';
import { useToast } from '~/components/toast/useToast';
import {
    useBooking,
    useUploadBookingFile,
    useDeleteBookingFile,
    useDownloadBookingFile,
    useReportHostNoShow,
    BookingEditForm,
    BookingMetaSection,
    BookingHeader,
} from '~/features/booking';
import type { IBookingFile } from '~/features/booking';
import { useAuth } from '~/features/member';
import { useHostCalendar } from '~/features/host';
import { cn } from '~/libs/cn';
import { getErrorMessage } from '~/libs/errorUtils';
import {
    FILE_UPLOAD_LIMITS,
    formatFileSize,
    getAcceptedFileTypes,
    type FileValidationError,
    validateFiles,
} from '~/libs/fileValidation';
import { canUploadMoreFiles } from './bookingUploadUtils';

/* --- Sortable file item --------------------------------------------------- */

interface SortableFileItemProps {
    file: IBookingFile;
    onDownload: (fileId: number, fileName: string) => void;
    onDelete: (fileId: number) => void;
    isDeleting: boolean;
}

function SortableFileItem({ file, onDownload, onDelete, isDeleting }: SortableFileItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: String(file.id),
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3',
                isDragging && 'opacity-50 shadow-lg',
            )}
        >
            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="드래그로 순서 변경"
                className="flex-shrink-0 cursor-grab select-none px-1 text-gray-300 hover:text-gray-500 active:cursor-grabbing"
            >
                <span aria-hidden="true">&#8801;</span>
            </button>

            <button
                type="button"
                onClick={() =>
                    onDownload(file.id, file.originalFileName || file.fileName.split('/').pop() || 'download')
                }
                className="flex-1 truncate text-left text-sm text-blue-600 hover:underline"
            >
                {file.originalFileName || file.fileName.split('/').pop()}
            </button>

            {file.fileSize != null && (
                <span className="flex-shrink-0 text-xs text-gray-400">{formatFileSize(file.fileSize)}</span>
            )}

            <button
                type="button"
                onClick={() => onDelete(file.id)}
                disabled={isDeleting}
                className="flex-shrink-0 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
            >
                {isDeleting ? '...' : '삭제'}
            </button>
        </li>
    );
}

export function Detail() {
    const { id } = useParams({ from: '/booking/$id' });
    const { showToast } = useToast();
    const { data: booking, isLoading, error, refetch } = useBooking(id);
    const { data: currentUser } = useAuth();
    const { mutateAsync: uploadFileAsync, isPending: isUploading, error: uploadError } = useUploadBookingFile(id);
    const { mutateAsync: deleteFileAsync, isPending: isDeleting } = useDeleteBookingFile(Number(id));
    const { mutateAsync: downloadFileAsync, error: downloadError } = useDownloadBookingFile(Number(id));
    const { mutate: reportNoShow, isPending: isReporting, error: reportError, reset: resetReport } =
        useReportHostNoShow(Number(id));

    const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState('');
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const { data: hostCalendar } = useHostCalendar(booking?.host.username ?? '');

    // Host no-show report state
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [fileOrder, setFileOrder] = useState<IBookingFile[]>([]);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 10_000);
        return () => clearInterval(timer);
    }, []);

    const isMeetingStarted = useMemo(() => {
        if (!booking) return false;
        return now >= booking.startedAt.getTime();
    }, [booking, now]);

    useEffect(() => {
        if (!booking) return;
        setFileOrder((prev) => {
            const existingIds = new Set(prev.map((file) => file.id));
            const valid = prev.filter((file) => booking.files.some((bookingFile) => bookingFile.id === file.id));
            const added = booking.files.filter((file) => !existingIds.has(file.id));
            return [...valid, ...added];
        });
    }, [booking]);

    const fileIds = useMemo(() => fileOrder.map((file) => String(file.id)), [fileOrder]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    // 현재 사용자가 이 예약의 게스트인지 판단
    const isGuest = !!currentUser && currentUser.id === booking?.guestId;
    const isAlreadyReported = booking?.attendanceStatus === 'HOST_NO_SHOW';
    const canEdit = isGuest && booking?.attendanceStatus === 'SCHEDULED' && !isEditing;
    const canReport = isGuest && booking?.attendanceStatus === 'SCHEDULED' && isMeetingStarted;

    const handleEditCancel = useCallback(() => setIsEditing(false), []);
    const handleEditSuccess = useCallback(() => setIsEditing(false), []);

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) {
            setSelectedFiles([]);
            setValidationErrors([]);
            return;
        }

        const existingCount = booking?.files.length ?? 0;
        const existingSize = booking?.files.reduce((sum, file) => sum + (file.fileSize || 0), 0) ?? 0;
        const result = validateFiles(files, existingCount, existingSize);
        setValidationErrors(result.errors);
        setSelectedFiles(Array.from(files));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(event.target.files);
    };

    const handleDropZoneDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDropZoneDragLeave = (event: React.DragEvent) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDraggingOver(false);
        }
    };

    const handleDropZoneDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDraggingOver(false);
        handleFileSelect(event.dataTransfer.files);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (validationErrors.length > 0 || selectedFiles.length === 0) return;

        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                setUploadProgress(`${i + 1}/${selectedFiles.length} 업로드 중...`);
                await uploadFileAsync(selectedFiles[i]);
            }

            refetch();
            setSelectedFiles([]);
            setValidationErrors([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch {
            // 파일 선택 유지하여 사용자가 다른 파일로 재시도 가능
        } finally {
            setUploadProgress('');
        }
    };

    const handleDownload = async (fileId: number, fileName: string) => {
        await downloadFileAsync({ fileId, fileName });
    };

    const handleDelete = async (fileId: number) => {
        try {
            setDeletingFileId(fileId);
            await deleteFileAsync(fileId);
            refetch();
        } catch (err) {
            showToast(getErrorMessage(err, '파일 삭제에 실패했습니다.'), 'booking-delete-error');
        } finally {
            setDeletingFileId(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setFileOrder((items) => {
                const oldIndex = items.findIndex((file) => String(file.id) === active.id);
                const newIndex = items.findIndex((file) => String(file.id) === over.id);
                if (oldIndex === -1 || newIndex === -1) return items;
                return arrayMove(items, oldIndex, newIndex);
            });
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

    if (isLoading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-[var(--cohi-bg-light)]">
                <p className="text-gray-500">예약 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-[var(--cohi-bg-light)]">
                <p className="text-red-500">예약 정보를 불러오는 중 오류가 발생했습니다.</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-[var(--cohi-bg-light)]">
                <p className="text-gray-500">예약 정보를 찾을 수 없습니다.</p>
            </div>
        );
    }

    const canUploadMore = canUploadMoreFiles(fileOrder.length);

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
                </Card>

                {isGuest && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
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
                                    className={cn('rounded-xl', isMeetingStarted && 'bg-red-600 hover:bg-red-700')}
                                >
                                    호스트 노쇼 신고
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-3">
                                <textarea
                                    className="w-full resize-none rounded-xl border border-amber-200 p-3 text-sm focus:border-amber-500 focus:ring-amber-500"
                                    rows={3}
                                    placeholder="신고 사유를 입력해주세요 (선택)"
                                    value={reportReason}
                                    onChange={(event) => setReportReason(event.target.value)}
                                />
                                {reportError && <p className="text-sm text-red-600">{reportError.message}</p>}
                                <div className="flex flex-row space-x-2">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        loading={isReporting}
                                        onClick={handleReportSubmit}
                                        className="rounded-xl bg-red-600 px-6 hover:bg-red-700"
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
                                        className="rounded-xl px-6"
                                    >
                                        취소
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <Card className="space-y-5 border border-gray-100" title="파일 첨부">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>허용 형식: {FILE_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.join(', ')}</span>
                        <span>최대 크기: {formatFileSize(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE)}</span>
                        <span>첨부 {fileOrder.length}/{FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING}개</span>
                    </div>

                    {canUploadMore ? (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div
                                onDragOver={handleDropZoneDragOver}
                                onDragLeave={handleDropZoneDragLeave}
                                onDrop={handleDropZoneDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors',
                                    isDraggingOver
                                        ? 'border-[var(--cohi-primary)] bg-[var(--cohi-primary)]/5'
                                        : 'border-gray-200 hover:border-[var(--cohi-primary)]/50 hover:bg-gray-50',
                                )}
                            >
                                <span className="select-none text-2xl" aria-hidden="true">
                                    &#8679;
                                </span>
                                <p className="text-sm text-gray-500">
                                    {isDraggingOver ? '파일을 놓으세요' : '파일을 드래그하거나 클릭해서 선택'}
                                </p>
                                {selectedFiles.length > 0 && (
                                    <p className="text-sm font-medium text-[var(--cohi-primary)]">
                                        {selectedFiles.map((file) => file.name).join(', ')}
                                    </p>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    name="files"
                                    multiple
                                    accept={getAcceptedFileTypes()}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            {validationErrors.length > 0 && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                    <p className="mb-1 text-sm font-medium text-red-700">파일 업로드 오류</p>
                                    <ul className="list-disc space-y-0.5 pl-4 text-sm text-red-600">
                                        {validationErrors.map((validationError, index) => (
                                            <li key={index}>{validationError.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {uploadError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                    <p className="text-sm text-red-600">업로드 실패: {uploadError.message}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={validationErrors.length > 0 || selectedFiles.length === 0}
                                loading={isUploading}
                            >
                                {isUploading ? uploadProgress || '업로드 중...' : '첨부하기'}
                            </Button>
                        </form>
                    ) : (
                        <p className="text-sm text-red-500">
                            최대 파일 개수에 도달했습니다. 더 파일을 첨부하려면 기존 파일을 삭제해주세요.
                        </p>
                    )}

                    {fileOrder.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">첨부된 파일</p>
                            <p className="text-xs text-gray-400">드래그해서 순서를 변경할 수 있습니다. 현재 세션에서만 유지됩니다.</p>
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
                                    <ul className="space-y-2">
                                        {fileOrder.map((file) => (
                                            <SortableFileItem
                                                key={file.id}
                                                file={file}
                                                onDownload={handleDownload}
                                                onDelete={handleDelete}
                                                isDeleting={isDeleting && deletingFileId === file.id}
                                            />
                                        ))}
                                    </ul>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {downloadError && (
                        <p className="mt-1 text-sm text-red-500">
                            {getErrorMessage(downloadError, '파일 다운로드에 실패했습니다.')}
                        </p>
                    )}

                    {fileOrder.length === 0 && <p className="text-sm text-gray-400">첨부 파일이 없습니다.</p>}
                </Card>
            </div>
        </PageLayout>
    );
}

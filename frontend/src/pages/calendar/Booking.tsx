import { Link, useParams } from '@tanstack/react-router';
import { useState, useRef, useEffect, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PageHeader from '~/components/PageHeader';
import { Button } from '~/components/button';
import { useBooking, useUploadBookingFile } from '~/features/calendar';
import type { IBookingFile } from '~/features/calendar';
import {
    validateFiles,
    getAcceptedFileTypes,
    formatFileSize,
    FILE_UPLOAD_LIMITS,
    type FileValidationError,
} from '~/libs/fileValidation';
import { getValidToken } from '~/libs/jwt';
import { cn } from '~/libs/cn';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/* ─── Sortable file item ─────────────────────────────────────────────────── */

interface SortableFileItemProps {
    file: IBookingFile;
    onDownload: (fileId: number, fileName: string) => void;
}

function SortableFileItem({ file, onDownload }: SortableFileItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: file.id,
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
                'flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100',
                isDragging && 'opacity-50 shadow-lg',
            )}
        >
            {/* Drag handle */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="드래그로 순서 변경"
                className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 select-none px-1"
            >
                <span aria-hidden="true">&#8801;</span>
            </button>

            {/* File name (download on click) */}
            <button
                type="button"
                onClick={() =>
                    onDownload(file.id, file.originalFileName || file.file.split('/').pop() || 'download')
                }
                className="text-blue-600 hover:underline flex-1 truncate text-left text-sm"
            >
                {file.originalFileName || file.file.split('/').pop()}
            </button>

            {/* File size */}
            {file.fileSize != null && (
                <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(file.fileSize)}</span>
            )}
        </li>
    );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function Booking() {
    const { id } = useParams({ from: '/booking/$id' });
    const { data: booking, isLoading, error, refetch } = useBooking(id);
    const { mutateAsync: uploadFileAsync, isPending: isUploading, error: uploadError } = useUploadBookingFile(id);

    // File upload state
    const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sortable file list — preserves DnD order across refetches
    const [fileOrder, setFileOrder] = useState<IBookingFile[]>([]);

    useEffect(() => {
        if (!booking) return;
        setFileOrder((prev) => {
            // Keep user's custom order; append only newly added files at the end
            const existingIds = new Set(prev.map((f) => f.id));
            const valid = prev.filter((f) => booking.files.some((bf) => bf.id === f.id));
            const added = booking.files.filter((f) => !existingIds.has(f.id));
            return [...valid, ...added];
        });
    }, [booking]);

    // Stable items array for SortableContext (avoids recreating on every render)
    const fileIds = useMemo(() => fileOrder.map((f) => f.id), [fileOrder]);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    /* ── Handlers ────────────────────────────────────────────────────── */

    const handleFileSelect = (files: FileList | null) => {
        if (!files || files.length === 0) {
            setSelectedFiles([]);
            setValidationErrors([]);
            return;
        }
        const existingCount = booking?.files.length ?? 0;
        const existingSize = booking?.files.reduce((sum, f) => sum + (f.fileSize || 0), 0) ?? 0;
        const result = validateFiles(files, existingCount, existingSize);
        setValidationErrors(result.errors);
        setSelectedFiles(Array.from(files));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files);
    };

    // Desktop drag-and-drop into upload zone
    const handleDropZoneDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDropZoneDragLeave = (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDraggingOver(false);
        }
    };

    const handleDropZoneDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (validationErrors.length > 0 || selectedFiles.length === 0) return;

        for (let i = 0; i < selectedFiles.length; i++) {
            setUploadProgress(`${i + 1}/${selectedFiles.length} 업로드 중...`);
            const formData = new FormData();
            formData.append('file', selectedFiles[i]);
            await uploadFileAsync(formData);
        }

        setUploadProgress('');
        setSelectedFiles([]);
        setValidationErrors([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        refetch();
    };

    const handleDownload = async (fileId: number, fileName: string) => {
        try {
            const token = getValidToken();
            const response = await fetch(`${API_URL}/bookings/${id}/files/${fileId}/download`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('다운로드에 실패했습니다.');

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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setFileOrder((items) => {
                const oldIndex = items.findIndex((f) => f.id === active.id);
                const newIndex = items.findIndex((f) => f.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    /* ── Loading / error states ──────────────────────────────────────── */

    if (isLoading || !booking) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohe-bg-light)] flex items-center justify-center">
                <p className="text-gray-500">예약 정보를 불러오고 있습니다...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen bg-[var(--cohe-bg-light)] flex items-center justify-center">
                <p className="text-red-500">예약 정보를 불러오는 중 오류가 발생했습니다.</p>
            </div>
        );
    }

    const when = new Date(booking.when);
    const canUploadMore = fileOrder.length < FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING;

    return (
        <div className="w-full min-h-screen bg-[var(--cohe-bg-light)]">
            <PageHeader />

            <main className="w-full px-6 py-8 pb-16">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Back link */}
                    <Link
                        to="/my-bookings"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--cohe-primary)]"
                    >
                        &larr; 내 예약 목록으로
                    </Link>

                    {/* Booking info card */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-12 h-12 rounded-full bg-[var(--cohe-bg-warm)] flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-semibold text-[var(--cohe-primary)]">
                                    {booking.host.displayName[0] ?? '?'}
                                </span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-[var(--cohe-text-dark)]">
                                    {booking.host.displayName}님과의 커피챗
                                </h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {when.toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}{' '}
                                    {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">주제</span>
                                <p className="mt-1 text-gray-800">{booking.topic}</p>
                            </div>
                            {booking.description && (
                                <div>
                                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">설명</span>
                                    <p className="mt-1 text-gray-600 text-sm leading-relaxed">{booking.description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* File section */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                        <h2 className="text-lg font-semibold text-[var(--cohe-text-dark)]">파일 첨부</h2>

                        {/* Capacity info */}
                        <p className="text-xs text-gray-400">
                            허용 형식: {FILE_UPLOAD_LIMITS.ALLOWED_EXTENSIONS.join(', ')} &nbsp;|&nbsp;
                            최대 크기: {formatFileSize(FILE_UPLOAD_LIMITS.MAX_FILE_SIZE)} &nbsp;|&nbsp;
                            첨부 {fileOrder.length}/{FILE_UPLOAD_LIMITS.MAX_FILES_PER_BOOKING}개
                        </p>

                        {/* Upload form */}
                        {canUploadMore ? (
                            <form onSubmit={handleSubmit} className="space-y-3">
                                {/* Drop zone */}
                                <div
                                    onDragOver={handleDropZoneDragOver}
                                    onDragLeave={handleDropZoneDragLeave}
                                    onDrop={handleDropZoneDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        'flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
                                        isDraggingOver
                                            ? 'border-[var(--cohe-primary)] bg-[var(--cohe-primary)]/5'
                                            : 'border-gray-200 hover:border-[var(--cohe-primary)]/50 hover:bg-gray-50',
                                    )}
                                >
                                    <span className="text-2xl select-none" aria-hidden="true">&#8679;</span>
                                    <p className="text-sm text-gray-500">
                                        {isDraggingOver
                                            ? '파일을 놓으세요'
                                            : '파일을 드래그하거나 클릭해서 선택'}
                                    </p>
                                    {selectedFiles.length > 0 && (
                                        <p className="text-sm text-[var(--cohe-primary)] font-medium">
                                            {selectedFiles.map((f) => f.name).join(', ')}
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

                                {/* Validation errors */}
                                {validationErrors.length > 0 && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <p className="text-red-700 font-medium text-sm mb-1">파일 업로드 오류</p>
                                        <ul className="list-disc pl-4 text-red-600 text-sm space-y-0.5">
                                            {validationErrors.map((err) => (
                                                <li key={err.message}>{err.message}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Upload API error */}
                                {uploadError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                        <p className="text-red-600 text-sm">업로드 실패: {uploadError.message}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="w-full"
                                    disabled={validationErrors.length > 0 || selectedFiles.length === 0}
                                    loading={isUploading}
                                >
                                    {isUploading ? (uploadProgress || '업로드 중...') : '첨부하기'}
                                </Button>
                            </form>
                        ) : (
                            <p className="text-sm text-red-500">
                                최대 파일 개수에 도달했습니다. 새 파일을 첨부하려면 기존 파일을 삭제해주세요.
                            </p>
                        )}

                        {/* Attached file list (sortable) */}
                        {fileOrder.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-600">첨부된 파일</p>
                                <p className="text-xs text-gray-400">드래그해서 순서를 변경할 수 있습니다.</p>
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
                                                />
                                            ))}
                                        </ul>
                                    </SortableContext>
                                </DndContext>
                            </div>
                        )}

                        {fileOrder.length === 0 && !canUploadMore && (
                            <p className="text-sm text-gray-400">첨부 파일이 없습니다.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

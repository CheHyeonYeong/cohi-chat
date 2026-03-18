import { useEffect, useState } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    closestCenter,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LinkButton } from '~/components/button/LinkButton';
import { PageLayout } from '~/components';
import { Pagination } from '~/components/Pagination';
import { useToast } from '~/components/toast/useToast';
import { useAllMyBookings, useBooking, useUploadBookingFile, useDeleteBookingFile, getPresignedDownloadUrl, BookingCard, BookingDetailPanel } from '~/features/booking';
import { getErrorMessage } from '~/libs/errorUtils';
import type { IBookingWithRole } from '~/features/booking';

// Sortable wrapper for BookingCard
function SortableBookingCard({
    booking,
    isSelected,
    onSelect,
}: {
    booking: IBookingWithRole;
    isSelected: boolean;
    onSelect: (id: number) => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: booking.id,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <BookingCard booking={booking} isSelected={isSelected} onSelect={onSelect} role={booking.role} counterpart={booking.counterpart} />
        </div>
    );
}

export function MyBookings() {
    const PAGE_SIZE = 5;
    const { page, selectedId } = useSearch({ from: '/booking/my-bookings' });
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { data: bookings, isLoading, error, refetch: refetchMyBookings } = useAllMyBookings({ page, pageSize: PAGE_SIZE });
    const [sortedIds, setSortedIds] = useState<number[]>([]);

    useEffect(() => {
        if (bookings?.bookings) {
            setSortedIds(bookings.bookings.map(b => b.id));
        }
    }, [bookings]);

    // 선택된 예약 full detail (파일 포함)
    const { data: selectedBooking, refetch: refetchSelectedBooking } = useBooking(selectedId ?? null);

    const { mutateAsync: uploadFileAsync, isPending: isUploading, error: uploadError, reset: resetUploadError } = useUploadBookingFile(selectedId ?? 0);
    const { mutateAsync: deleteFileAsync, isPending: isDeleting } = useDeleteBookingFile(selectedId ?? 0);

    const setSelectedId = (id: number | undefined) => {
        navigate({
            to: '/booking/my-bookings',
            search: { page, selectedId: id },
            replace: true,
        });
    };

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handlePageChange = (newPage: number) => {
        navigate({ to: '/booking/my-bookings', search: { page: newPage } });
    };

    const handleCardSelect = (id: number) => {
        setSelectedId(selectedId === id ? undefined : id);
    };

    // sortedIds가 비어있거나 데이터와 매칭되지 않으면 API 순서 사용
    const orderedBookings = (() => {
        if (!bookings?.bookings) return [];
        // 페이지가 바뀌어서 데이터 개수가 다르거나, 현재 데이터 중 일부가 sortedIds에 없으면
        // useEffect가 돌아서 setSortedIds를 해주기 전까지는 API 순서를 그대로 보여줌
        if (sortedIds.length !== bookings.bookings.length ||
            !bookings.bookings.every(b => sortedIds.includes(b.id))) {
            return bookings.bookings;
        }

        return sortedIds
            .map((id) => bookings.bookings.find((b) => b.id === id))
            .filter((b): b is IBookingWithRole => b != null);
    })();

    const selectedBookingWithRole = orderedBookings.find((b) => b.id === selectedId);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const ids = orderedBookings.map((b) => b.id);
        const oldIndex = ids.indexOf(Number(active.id));
        const newIndex = ids.indexOf(Number(over.id));
        setSortedIds(arrayMove(ids, oldIndex, newIndex));
    };

    const handleUpload = async (files: FileList) => {
        if (!selectedId) return;
        resetUploadError(); // 이전 에러 초기화
        try {
            for (const file of files) {
                await uploadFileAsync(file);
            }
            await Promise.all([refetchSelectedBooking(), refetchMyBookings()]);
        } catch {
            // 파일 선택 유지하여 사용자가 다른 파일로 재시도 가능
        }
    };

    const handleDownload = async (fileId: number, fileName: string) => {
        if (!selectedId) return;
        try {
            // Pre-signed URL을 사용하여 S3에서 직접 다운로드
            const { url } = await getPresignedDownloadUrl(selectedId, fileId);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            showToast(getErrorMessage(err, '파일 다운로드 실패'), 'my-bookings-download-error');
        }
    };

    const handleDelete = async (fileId: number) => {
        if (!selectedId) return;
        try {
            await deleteFileAsync(fileId);
            await refetchSelectedBooking();
        } catch (err) {
            showToast(getErrorMessage(err, '파일 삭제 실패'), 'my-bookings-delete-error');
        }
    };

    return (
        <PageLayout title="내 예약 목록" className="pb-16">
            {isLoading && (
                <div className="text-center py-16 text-gray-500">내 예약 목록을 불러오고 있습니다...</div>
            )}

            {error && (
                <div className="text-center py-16 space-y-4">
                    <p className="text-red-500">{error.message}</p>
                    {error.cause === 401 && (
                        <LinkButton variant="primary" to="/login">로그인하기</LinkButton>
                    )}
                </div>
            )}

            {!isLoading && !error && bookings?.bookings.length === 0 && (
                <div className="text-center py-16 text-gray-500">예약 내역이 없습니다.</div>
            )}

            {bookings && bookings.bookings.length > 0 && (
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: booking list */}
                    <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-4">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={orderedBookings.map((b) => b.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {orderedBookings.map((booking) => (
                                    <SortableBookingCard
                                        key={booking.id}
                                        booking={booking}
                                        isSelected={selectedId === booking.id}
                                        onSelect={handleCardSelect}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        <Pagination
                            page={page}
                            pageSize={PAGE_SIZE}
                            totalCount={bookings.totalCount}
                            onPageChange={handlePageChange}
                        />
                    </div>

                    {/* Right: detail panel */}
                    <div className="flex-1 min-w-0">
                        {selectedId && selectedBooking ? (
                            <BookingDetailPanel
                                booking={selectedBooking}
                                onUpload={handleUpload}
                                onDownload={handleDownload}
                                onDelete={handleDelete}
                                isUploading={isUploading}
                                isDeleting={isDeleting}
                                uploadError={uploadError}
                                role={selectedBookingWithRole?.role}
                                counterpart={selectedBookingWithRole?.counterpart}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                                        예약을 선택하면 상세 정보를 볼 수 있습니다
                            </div>
                        )}
                    </div>
                </div>
            )}
        </PageLayout>
    );
}

import { useState } from 'react';
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
import LinkButton from '~/components/button/LinkButton';
import PageHeader from '~/components/PageHeader';
import Pagination from '~/components/Pagination';
import { useMyBookings, useBooking, useUploadBookingFile } from '~/features/calendar';
import BookingCard from '~/features/calendar/components/BookingCard';
import BookingDetailPanel from '~/features/calendar/components/BookingDetailPanel';
import FileDropZone from '~/features/calendar/components/FileDropZone';
import { getValidToken } from '~/libs/jwt';
import { getErrorMessage } from '~/libs/errorUtils';
import type { IBookingDetail } from '~/features/calendar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Sortable wrapper for BookingCard
function SortableBookingCard({
    booking,
    isSelected,
    onSelect,
}: {
    booking: IBookingDetail;
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
            <BookingCard booking={booking} isSelected={isSelected} onSelect={onSelect} />
        </div>
    );
}

export default function MyBookings() {
    const { page, pageSize } = useSearch({ from: '/my-bookings' });
    const navigate = useNavigate();
    const { data: bookings, isLoading, error } = useMyBookings({ page, pageSize });

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [sortedIds, setSortedIds] = useState<number[]>([]);

    // 선택된 예약 full detail (파일 포함)
    const { data: selectedBooking } = useBooking(selectedId);
    const { mutateAsync: uploadFileAsync, isPending: isUploading } = useUploadBookingFile(selectedId ?? 0);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handlePageChange = (newPage: number) => {
        setSelectedId(null);
        navigate({ to: '/my-bookings', search: { page: newPage, pageSize } });
    };

    const handleCardSelect = (id: number) => {
        setSelectedId((prev) => (prev === id ? null : id));
    };

    // sortedIds가 비어있으면 API 순서, 있으면 드래그 정렬 순서 사용
    const orderedBookings = (() => {
        if (!bookings?.bookings) return [];
        if (sortedIds.length === 0) return bookings.bookings;
        return sortedIds
            .map((id) => bookings.bookings.find((b) => b.id === id))
            .filter((b): b is IBookingDetail => b != null);
    })();

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const ids = orderedBookings.map((b) => b.id);
        const oldIndex = ids.indexOf(Number(active.id));
        const newIndex = ids.indexOf(Number(over.id));
        setSortedIds(arrayMove(ids, oldIndex, newIndex));
    };

    const handleUpload = async (files: FileList) => {
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            await uploadFileAsync(formData);
        }
    };

    const handleDownload = async (fileId: number, fileName: string) => {
        try {
            const token = getValidToken();
            const res = await fetch(`${API_URL}/bookings/${selectedId}/files/${fileId}/download`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('다운로드 실패');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(getErrorMessage(err, '파일 다운로드 실패'));
        }
    };

    return (
        <div className="w-full min-h-screen bg-[var(--cohe-bg-light)]">
            <PageHeader />

            <main className="w-full px-6 py-8 pb-16">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold text-[var(--cohe-text-dark)] mb-6">내 예약 목록</h1>

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
                                    pageSize={pageSize}
                                    totalCount={bookings.totalCount}
                                    onPageChange={handlePageChange}
                                />
                            </div>

                            {/* Right: detail panel */}
                            <div className="flex-1 min-w-0">
                                {selectedId && selectedBooking ? (
                                    <div className="flex flex-col gap-4">
                                        <BookingDetailPanel
                                            booking={selectedBooking}
                                            onUpload={handleUpload}
                                            onDownload={handleDownload}
                                            isUploading={isUploading}
                                        />
                                        <FileDropZone
                                            onFilesDropped={handleUpload}
                                            disabled={isUploading}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-64 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                                        예약을 선택하면 상세 정보를 볼 수 있습니다
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

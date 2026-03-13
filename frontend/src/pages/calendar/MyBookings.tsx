import { useEffect, useMemo, useState } from 'react';
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
import { useMyBookings, useMyHostBookings, useBooking, useUploadBookingFile } from '~/features/calendar';
import BookingCard from '~/features/calendar/components/BookingCard';
import BookingActionMenu from '~/features/calendar/components/BookingCard/BookingActionMenu';
import BookingDetailPanel from '~/features/calendar/components/BookingDetailPanel';
import FileDropZone from '~/features/calendar/components/FileDropZone';
import { getErrorMessage } from '~/libs/errorUtils';
import { downloadFileWithPresignedUrl } from '~/features/calendar/api/bookings';
import { cn } from '~/libs/cn';
import type { IBookingDetail } from '~/features/calendar';

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
            <BookingCard
                booking={booking}
                isSelected={isSelected}
                onSelect={onSelect}
                headerAction={<BookingActionMenu booking={booking} />}
            />
        </div>
    );
}

export default function MyBookings() {
    const { page, pageSize, tab } = useSearch({ from: '/my-bookings' });
    const navigate = useNavigate();
    const { data: guestBookings, isLoading: isGuestLoading, error: guestError, refetch: refetchMyBookings } = useMyBookings({ page, pageSize, enabled: tab !== 'host' });
    const { data: hostBookings, isLoading: isHostLoading, error: hostError, refetch: refetchHostBookings } = useMyHostBookings({ page, pageSize, enabled: tab === 'host' });
    const bookings = tab === 'host' ? hostBookings : guestBookings;
    const isLoading = tab === 'host' ? isHostLoading : isGuestLoading;
    const error = tab === 'host' ? hostError : guestError;
    const refetchActiveBookings = tab === 'host' ? refetchHostBookings : refetchMyBookings;

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [sortedIds, setSortedIds] = useState<number[]>([]);

    useEffect(() => {
        if (bookings?.bookings) {
            setSortedIds(bookings.bookings.map(b => b.id));
        }
    }, [bookings]);

    // 선택된 예약 full detail (파일 포함)
    const { data: selectedBooking, refetch: refetchSelectedBooking } = useBooking(selectedId);
    const { mutateAsync: uploadFileAsync, isPending: isUploading } = useUploadBookingFile(selectedId ?? 0);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handleTabChange = (newTab: 'guest' | 'host') => {
        setSelectedId(null);
        setSortedIds([]);
        navigate({ to: '/my-bookings', search: { page: 1, pageSize, tab: newTab } });
    };

    const handlePageChange = (newPage: number) => {
        setSelectedId(null);
        navigate({ to: '/my-bookings', search: { page: newPage, pageSize, tab } });
    };

    const handleCardSelect = (id: number) => {
        setSelectedId((prev) => (prev === id ? null : id));
    };

    // sortedIds가 비어있거나 데이터와 매칭되지 않으면 API 순서 사용
    // 페이지가 바뀌어서 데이터 개수가 다르거나, 현재 데이터 중 일부가 sortedIds에 없으면
    // useEffect가 돌아서 setSortedIds를 해주기 전까지는 API 순서를 그대로 보여줌
    const orderedBookings = useMemo(() => {
        if (!bookings?.bookings) return [];
        const sortedIdSet = new Set(sortedIds);
        if (sortedIds.length !== bookings.bookings.length ||
            !bookings.bookings.every(b => sortedIdSet.has(b.id))) {
            return bookings.bookings;
        }
        const bookingMap = new Map(bookings.bookings.map(b => [b.id, b]));
        return sortedIds.map(id => bookingMap.get(id)).filter((b): b is IBookingDetail => b != null);
    }, [bookings?.bookings, sortedIds]);

    const sortableItemIds = useMemo(() => orderedBookings.map((b) => b.id), [orderedBookings]);

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
        for (const file of files) {
            await uploadFileAsync(file);
        }
        await Promise.all([refetchSelectedBooking(), refetchActiveBookings()]);
    };

    const handleDownload = async (fileId: number, fileName: string) => {
        try {
            await downloadFileWithPresignedUrl(selectedId!, fileId, fileName);
        } catch (err) {
            console.error(getErrorMessage(err, '파일 다운로드 실패'));
        }
    };

    return (
        <div className="w-full min-h-screen bg-[var(--cohi-bg-light)]">
            <PageHeader />

            <main className="w-full px-6 py-8 pb-16">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold text-[var(--cohi-text-dark)] mb-6">내 예약 목록</h1>

                    <div className="flex gap-1 mb-4 border-b border-gray-200">
                        <button
                            type="button"
                            onClick={() => handleTabChange('guest')}
                            className={cn(
                                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                                tab === 'guest'
                                    ? 'border-[var(--cohi-primary)] text-[var(--cohi-primary)]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            )}
                        >
                            내가 신청한 예약
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('host')}
                            className={cn(
                                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                                tab === 'host'
                                    ? 'border-[var(--cohi-primary)] text-[var(--cohi-primary)]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            )}
                        >
                            내가 받은 예약
                        </button>
                    </div>

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
                                        items={sortableItemIds}
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

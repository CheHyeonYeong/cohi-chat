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
import { useAllMyBookings, BookingCard } from '~/features/booking';
import type { IBookingWithRole } from '~/features/booking';

// Sortable wrapper for BookingCard
function SortableBookingCard({
    booking,
    onSelect,
}: {
    booking: IBookingWithRole;
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
            <BookingCard booking={booking} onSelect={onSelect} role={booking.role} counterpart={booking.counterpart} />
        </div>
    );
}

export function MyBookings() {
    const PAGE_SIZE = 5;
    const { page } = useSearch({ from: '/booking/my-bookings' });
    const navigate = useNavigate();
    const { data: bookings, isLoading, error } = useAllMyBookings({ page, pageSize: PAGE_SIZE });
    const [sortedIds, setSortedIds] = useState<number[]>([]);

    useEffect(() => {
        if (bookings?.bookings) {
            setSortedIds(bookings.bookings.map(b => b.id));
        }
    }, [bookings]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handlePageChange = (newPage: number) => {
        navigate({ to: '/booking/my-bookings', search: { page: newPage } });
    };

    // sortedIds가 비어있거나 데이터와 매칭되지 않으면 API 순서 사용
    const orderedBookings = (() => {
        if (!bookings?.bookings) return [];
        if (sortedIds.length !== bookings.bookings.length ||
            !bookings.bookings.every(b => sortedIds.includes(b.id))) {
            return bookings.bookings;
        }

        return sortedIds
            .map((id) => bookings.bookings.find((b) => b.id === id))
            .filter((b): b is IBookingWithRole => b != null);
    })();

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const ids = orderedBookings.map((b) => b.id);
        const oldIndex = ids.indexOf(Number(active.id));
        const newIndex = ids.indexOf(Number(over.id));
        setSortedIds(arrayMove(ids, oldIndex, newIndex));
    };

    const handleCardSelect = (id: number) => {
        const booking = orderedBookings.find((b) => b.id === id);
        if (!booking) return;
        const counterpartId = booking.role === 'guest' ? booking.hostId : booking.guestId;
        if (!counterpartId) return;
        navigate({ to: '/chat/rooms', search: { counterpartId } });
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
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4">
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
                                        onSelect={handleCardSelect}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>

                    <Pagination
                        page={page}
                        pageSize={PAGE_SIZE}
                        totalCount={bookings.totalCount}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </PageLayout>
    );
}

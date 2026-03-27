import type { CSSProperties } from 'react';
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
import { getErrorMessage } from '~/libs/errorUtils';
import { useChatRooms, useChatMessages, MessageList } from '~/features/chat';
import { useAuth } from '~/features/member';
import type { IBookingWithRole } from '~/features/booking';

const SortableBookingCard = ({
    booking,
    isSelected,
    onSelect,
}: {
    booking: IBookingWithRole;
    isSelected: boolean;
    onSelect: (id: number) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: booking.id,
    });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <BookingCard booking={booking} isSelected={isSelected} onSelect={onSelect} role={booking.role} counterpart={booking.counterpart} />
        </div>
    );
};

export const MyBookings = () => {
    const PAGE_SIZE = 5;
    const { page, selectedId } = useSearch({ from: '/booking/my-bookings' });
    const navigate = useNavigate();
    const { data: bookings, isLoading, error } = useAllMyBookings({ page, pageSize: PAGE_SIZE });
    const [sortedIds, setSortedIds] = useState<number[]>([]);
    const { data: authUser } = useAuth();
    const { data: rooms = [] } = useChatRooms({ enabled: !!bookings?.bookings.length });

    useEffect(() => {
        if (bookings?.bookings) {
            // 서버 데이터를 DnD 정렬용 로컬 상태로 동기화 — 드래그 순서 유지를 위해 필요
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSortedIds(bookings.bookings.map(b => b.id));
        }
    }, [bookings]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handlePageChange = (newPage: number) => {
        navigate({ to: '/booking/my-bookings', search: { page: newPage } });
    };

    const handleCardSelect = (id: number) => {
        navigate({
            to: '/booking/my-bookings',
            search: { page, selectedId: selectedId === id ? undefined : id },
            replace: true,
        });
    };

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

    const selectedBooking = orderedBookings.find((b) => b.id === selectedId);
    const counterpartId = selectedBooking
        ? (selectedBooking.role === 'guest' ? selectedBooking.hostId : selectedBooking.guestId)
        : undefined;

    // 예약 선택 시 해당 상대방의 채팅방 자동 선택
    const activeRoomId = counterpartId
        ? rooms.find((r) => r.counterpartId === counterpartId)?.id
        : undefined;
    const activeRoom = rooms.find((r) => r.id === activeRoomId);

    const { data: messagePage } = useChatMessages(activeRoomId);

    return (
        <PageLayout title="내 예약 목록" className="pb-16">
            {isLoading && (
                <div className="text-center py-16 text-gray-500">내 예약 목록을 불러오고 있습니다...</div>
            )}

            {error && (
                <div className="text-center py-16 space-y-4">
                    <p className="text-red-500">{getErrorMessage(error)}</p>
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
                    {/* Left: 예약 목록 */}
                    <div className="w-full lg:w-[380px] lg:h-[calc(100vh-12rem)] flex-shrink-0 flex flex-col">
                        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
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
                        </div>

                        <Pagination
                            page={page}
                            pageSize={PAGE_SIZE}
                            totalCount={bookings.totalCount}
                            onPageChange={handlePageChange}
                        />
                    </div>

                    {/* Right: 채팅창 */}
                    <div className="flex-1 min-w-0 border border-gray-200 rounded-2xl overflow-hidden flex flex-col lg:h-[calc(100vh-12rem)]">
                        {activeRoom && authUser ? (
                            <>
                                {/* 헤더 */}
                                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                                    {activeRoom.counterpartProfileImageUrl ? (
                                        <img
                                            src={activeRoom.counterpartProfileImageUrl}
                                            alt={activeRoom.counterpartName}
                                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-[var(--cohi-bg-warm,#fdf6ee)] flex items-center justify-center flex-shrink-0 text-sm font-medium text-[var(--cohi-primary,#b07d50)]">
                                            {activeRoom.counterpartName.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-semibold text-gray-900">{activeRoom.counterpartName}</span>
                                        <span className="text-xs text-gray-400">님과의 대화</span>
                                    </div>
                                </div>

                                {/* 메시지 목록 */}
                                {messagePage ? (
                                    <MessageList
                                        messages={messagePage.messages}
                                        currentUserId={authUser.id}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center flex-1 text-sm text-gray-400">
                                        메시지를 불러오는 중...
                                    </div>
                                )}

                                {/* 메시지 입력창 */}
                                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="메시지를 입력하세요"
                                        disabled
                                        className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none placeholder:text-gray-400"
                                    />
                                    <button
                                        type="button"
                                        disabled
                                        className="w-8 h-8 rounded-full bg-[var(--cohi-primary,#b07d50)] flex items-center justify-center text-white opacity-50 flex-shrink-0"
                                    >
                                        ↑
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-400">
                                <span className="text-4xl">☕</span>
                                <p className="text-sm">예약을 선택하면 채팅이 열립니다</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </PageLayout>
    );
};

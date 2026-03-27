import { Avatar } from '~/components/Avatar';
import { cn } from '~/libs/cn';
import type { ChatRoom } from '../../api';

const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
};

const lastMessagePreview = (room: ChatRoom): string => {
    if (!room.lastMessage) return '대화를 시작해보세요';
    if (room.lastMessage.messageType === 'RESERVATION_CARD') return '📅 예약 카드';
    if (room.lastMessage.messageType === 'SYSTEM') return '시스템 메시지';
    return room.lastMessage.content ?? '';
};

interface ChatRoomItemProps {
  room: ChatRoom;
  isSelected: boolean;
  onSelect: (roomId: string) => void;
}

export const ChatRoomItem = ({ room, isSelected, onSelect }: ChatRoomItemProps) => <button
    type="button"
    data-testid={`chat-room-item-${room.id}`}
    onClick={() => onSelect(room.id)}
    className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        isSelected
            ? 'bg-[var(--cohi-bg-warm)]'
            : 'hover:bg-gray-50',
    )}
>
    <Avatar displayName={room.counterpartName} profileImageUrl={room.counterpartProfileImageUrl ?? undefined} size="md" />

    <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm text-gray-900 truncate">{room.counterpartName}</span>
            {room.lastMessage && (
                <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatTime(room.lastMessage.createdAt)}
                </span>
            )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-gray-500 truncate">{lastMessagePreview(room)}</p>
            {room.unreadCount > 0 && (
                <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--cohi-primary)] text-white text-[10px] font-bold flex items-center justify-center">
                    {room.unreadCount > 99 ? '99+' : room.unreadCount}
                </span>
            )}
        </div>
    </div>
</button>;

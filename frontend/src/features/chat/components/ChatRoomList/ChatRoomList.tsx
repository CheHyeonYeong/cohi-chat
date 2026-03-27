import type { ChatRoom } from '../../api';
import { ChatRoomItem } from '../ChatRoomItem';

interface ChatRoomListProps {
  rooms: ChatRoom[];
  selectedRoomId: string | undefined;
  onSelect: (roomId: string) => void;
}

export const ChatRoomList = ({ rooms, selectedRoomId, onSelect }: ChatRoomListProps) => {
    if (rooms.length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">
        채팅방이 없습니다
            </div>
        );
    }

    return (
        <div data-testid="chat-room-list" className="divide-y divide-gray-100">
            {rooms.map((room) => (
                <ChatRoomItem
                    key={room.id}
                    room={room}
                    isSelected={selectedRoomId === room.id}
                    onSelect={onSelect}
                />
            ))}
        </div>
    );
};

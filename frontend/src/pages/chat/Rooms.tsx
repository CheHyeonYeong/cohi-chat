import { useEffect } from 'react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { PageLayout } from '~/components';
import { useAuth } from '~/features/member';
import { useChatRooms, useChatMessages, ChatRoomList, MessageList } from '~/features/chat';

export function Rooms() {
  const { roomId, counterpartId } = useSearch({ from: '/chat/rooms' });
  const navigate = useNavigate();
  const { data: authUser } = useAuth();

  const { data: rooms = [], isLoading: roomsLoading } = useChatRooms();
  const { data: messagePage, isLoading: messagesLoading } = useChatMessages(roomId);

  const selectedRoom = rooms.find((r) => r.id === roomId);

  // counterpartId로 진입 시 해당 채팅방 자동 선택
  useEffect(() => {
    if (!counterpartId || roomId || roomsLoading) return;
    const matched = rooms.find((r) => r.counterpartId === counterpartId);
    if (matched) {
      navigate({ to: '/chat/rooms', search: { roomId: matched.id }, replace: true });
    }
  }, [counterpartId, roomId, rooms, roomsLoading, navigate]);

  const handleSelectRoom = (id: string) => {
    navigate({ to: '/chat/rooms', search: { roomId: id }, replace: true });
  };

  return (
    <PageLayout title="메시지" maxWidth="6xl" className="!p-0">
      <div className="flex h-[calc(100vh-10rem)] border border-gray-200 rounded-2xl overflow-hidden">
        {/* 왼쪽: 채팅방 목록 */}
        <div className="w-[320px] flex-shrink-0 border-r border-gray-200 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-400">부담 없이 대화를 이어가세요</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="flex items-center justify-center h-20 text-sm text-gray-400">
                불러오는 중...
              </div>
            ) : (
              <ChatRoomList
                rooms={rooms}
                selectedRoomId={roomId}
                onSelect={handleSelectRoom}
              />
            )}
          </div>
        </div>

        {/* 오른쪽: 메시지 패널 */}
        <div className="flex-1 flex flex-col min-w-0">
          {roomId && selectedRoom ? (
            <>
              {/* 채팅방 헤더 */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <span className="font-semibold text-gray-900">{selectedRoom.counterpartName}</span>
                <span className="text-xs text-gray-400">님과의 대화</span>
              </div>

              {/* 메시지 목록 */}
              {messagesLoading ? (
                <div className="flex items-center justify-center flex-1 text-sm text-gray-400">
                  메시지를 불러오는 중...
                </div>
              ) : messagePage && authUser ? (
                <MessageList
                  messages={messagePage.messages}
                  currentUserId={authUser.id}
                />
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-gray-400">
              <span className="text-4xl">☕</span>
              <p className="text-sm">대화할 채팅방을 선택해주세요</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

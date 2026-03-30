import { ChatRoomStatus, ChatRoomType, MessageType } from '@prisma/client';

export interface ChatMessageSummaryDto {
  id: string;
  senderId: string | null;
  messageType: MessageType;
  content: string | null;
  createdAt: string;
}

export interface ChatRoomResponseDto {
  roomId: string;
  type: ChatRoomType;
  status: ChatRoomStatus;
  externalRefType: string | null;
  externalRefId: string | null;
  lastReadMessageId: string | null;
  unreadCount: number;
  lastMessage: ChatMessageSummaryDto | null;
}

export interface RoomUnreadCountDto {
  roomId: string;
  unreadCount: number;
}

export interface UnreadSummaryResponseDto {
  totalUnread: number;
  rooms: RoomUnreadCountDto[];
}

export interface MarkRoomAsReadResponseDto {
  roomId: string;
  lastReadMessageId: string | null;
  unreadCount: number;
}

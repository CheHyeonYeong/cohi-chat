import { ApiProperty } from '@nestjs/swagger';

export const CHAT_ROOM_TYPES = ['ONE_TO_ONE', 'GROUP'] as const;
export const CHAT_ROOM_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export const MESSAGE_TYPES = ['TEXT', 'RESERVATION_CARD', 'SYSTEM'] as const;

export type ChatRoomType = (typeof CHAT_ROOM_TYPES)[number];
export type ChatRoomStatus = (typeof CHAT_ROOM_STATUSES)[number];
export type MessageType = (typeof MESSAGE_TYPES)[number];

export class ChatMessageSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  senderId!: string | null;

  @ApiProperty({ enum: MESSAGE_TYPES, enumName: 'MessageType' })
  messageType!: MessageType;

  @ApiProperty({ nullable: true })
  content!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class ChatRoomResponseDto {
  @ApiProperty({ format: 'uuid' })
  roomId!: string;

  @ApiProperty({ enum: CHAT_ROOM_TYPES, enumName: 'ChatRoomType' })
  type!: ChatRoomType;

  @ApiProperty({ enum: CHAT_ROOM_STATUSES, enumName: 'ChatRoomStatus' })
  status!: ChatRoomStatus;

  @ApiProperty({ nullable: true })
  externalRefType!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  externalRefId!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  lastReadMessageId!: string | null;

  @ApiProperty()
  unreadCount!: number;

  @ApiProperty({ type: () => ChatMessageSummaryDto, nullable: true })
  lastMessage!: ChatMessageSummaryDto | null;
}

export class RoomUnreadCountDto {
  @ApiProperty({ format: 'uuid' })
  roomId!: string;

  @ApiProperty()
  unreadCount!: number;
}

export class UnreadSummaryResponseDto {
  @ApiProperty()
  totalUnread!: number;

  @ApiProperty({ type: () => RoomUnreadCountDto, isArray: true })
  rooms!: RoomUnreadCountDto[];
}

export class MarkRoomAsReadResponseDto {
  @ApiProperty({ format: 'uuid' })
  roomId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  lastReadMessageId!: string | null;

  @ApiProperty()
  unreadCount!: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { ChatRoomStatus, ChatRoomType, MessageType } from '@prisma/client';

export class ChatMessageSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  senderId!: string | null;

  @ApiProperty({ enum: MessageType, enumName: 'MessageType' })
  messageType!: MessageType;

  @ApiProperty({ nullable: true })
  content!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class ChatRoomResponseDto {
  @ApiProperty({ format: 'uuid' })
  roomId!: string;

  @ApiProperty({ enum: ChatRoomType, enumName: 'ChatRoomType' })
  type!: ChatRoomType;

  @ApiProperty({ enum: ChatRoomStatus, enumName: 'ChatRoomStatus' })
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

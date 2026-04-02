import { ApiProperty } from '@nestjs/swagger';

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

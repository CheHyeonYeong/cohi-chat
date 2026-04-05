import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LastMessageDto {
  @ApiProperty({
    description: 'Last message ID',
    example: '3f9b0f07-6f68-4cd1-8ae1-1f4ebbf4f9d2',
  })
  id!: string;

  @ApiPropertyOptional({
    description:
      'Last message content. Null when the message type does not use plain text.',
    nullable: true,
    example: 'hello',
  })
  content!: string | null;

  @ApiProperty({ description: 'Message type', example: 'TEXT' })
  messageType!: string;

  @ApiProperty({
    description: 'UTC ISO-8601 timestamp',
    example: '2026-03-30T00:00:00.000Z',
  })
  createdAt!: string;
}

export interface RoomQueryRow {
  id: string;
  counterpart_id: string;
  counterpart_name: string;
  counterpart_profile_image_url: string | null;
  last_message_id: string | null;
  last_message_content: string | null;
  last_message_type: string | null;
  last_message_created_at: Date | null;
  unread_count: number;
}

export class RoomResponseDto {
  @ApiProperty({
    description: 'Chat room ID',
    example: '57d8aef0-a2cc-4f18-b673-0ab8f7242f4c',
  })
  id!: string;

  @ApiProperty({
    description: 'Counterpart member ID',
    example: '763f94ea-3f54-42f9-bd1d-96e3516f0a1e',
  })
  counterpartId!: string;

  @ApiProperty({ description: 'Counterpart display name', example: 'Alex Kim' })
  counterpartName!: string;

  @ApiPropertyOptional({
    description: 'Counterpart profile image URL',
    nullable: true,
    example: 'https://cdn.example.com/profiles/alex.png',
  })
  counterpartProfileImageUrl!: string | null;

  @ApiPropertyOptional({
    description: 'Last message. Null when the room has no messages yet.',
    type: () => LastMessageDto,
    nullable: true,
  })
  lastMessage!: LastMessageDto | null;

  @ApiProperty({
    description: 'Unread message count for the caller',
    example: 3,
  })
  unreadCount!: number;

  static from(row: RoomQueryRow): RoomResponseDto {
    const dto = new RoomResponseDto();
    dto.id = row.id;
    dto.counterpartId = row.counterpart_id;
    dto.counterpartName = row.counterpart_name;
    dto.counterpartProfileImageUrl = row.counterpart_profile_image_url;
    dto.unreadCount = row.unread_count;
    dto.lastMessage =
      row.last_message_id &&
      row.last_message_type &&
      row.last_message_created_at instanceof Date
        ? {
            id: row.last_message_id,
            content: row.last_message_content,
            messageType: row.last_message_type,
            createdAt: row.last_message_created_at.toISOString(),
          }
        : null;

    return dto;
  }
}

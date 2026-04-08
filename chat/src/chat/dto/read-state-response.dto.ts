import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReadStateDto {
  @ApiProperty({
    description: 'Chat room ID',
    example: '57d8aef0-a2cc-4f18-b673-0ab8f7242f4c',
  })
  roomId!: string;

  @ApiPropertyOptional({
    description: 'Last read message ID. Null when the room has no messages yet.',
    nullable: true,
    example: '3f9b0f07-6f68-4cd1-8ae1-1f4ebbf4f9d2',
  })
  lastReadMessageId!: string | null;

  @ApiProperty({
    description: 'Unread message count after the stored read cursor',
    example: 0,
  })
  unreadCount!: number;
}

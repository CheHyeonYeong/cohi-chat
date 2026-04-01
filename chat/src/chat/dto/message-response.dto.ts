import { ApiProperty } from '@nestjs/swagger';

type MessageLike = {
  id: string;
  roomId: string;
  senderId: string | null;
  messageType: string;
  content: string | null;
  payload: unknown;
  createdAt: Date;
};

export class MessageDto {
  @ApiProperty({ example: 'uuid-v4', description: 'Message UUID' })
  id: string;

  @ApiProperty({ example: 'uuid-v4', description: 'Room UUID' })
  roomId: string;

  @ApiProperty({
    example: 'uuid-v4',
    nullable: true,
    description: 'Sender UUID. null for system messages.',
  })
  senderId: string | null;

  @ApiProperty({
    example: 'TEXT',
    description: 'TEXT | RESERVATION_CARD | SYSTEM',
  })
  messageType: string;

  @ApiProperty({
    example: 'hello',
    nullable: true,
    description: 'Message text body.',
  })
  content: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Additional JSON payload for non-text messages.',
    example: null,
  })
  payload: Record<string, unknown> | null;

  @ApiProperty({
    example: '2026-03-29T00:00:00.000Z',
    description: 'Creation time in ISO 8601 format.',
  })
  createdAt: string;

  static from(message: MessageLike): MessageDto {
    const dto = new MessageDto();
    dto.id = message.id;
    dto.roomId = message.roomId;
    dto.senderId = message.senderId;
    dto.messageType = message.messageType;
    dto.content = message.content;
    dto.payload =
      message.payload && typeof message.payload === 'object'
        ? (message.payload as Record<string, unknown>)
        : null;
    dto.createdAt = message.createdAt.toISOString();
    return dto;
  }
}

export class MessagePageResponse {
  @ApiProperty({ type: [MessageDto] })
  messages: MessageDto[];

  @ApiProperty({
    nullable: true,
    example: '2026-03-28T23:59:00.000Z',
    description:
      'Cursor for the next page. null when there are no older messages.',
  })
  nextCursor: string | null;
}

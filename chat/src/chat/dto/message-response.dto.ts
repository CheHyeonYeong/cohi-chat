import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';

type MessageRecord = {
  id: string;
  roomId: string;
  senderId: string | null;
  messageType: string;
  content: string | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
};

export class MessageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  roomId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  senderId!: string | null;

  @ApiProperty({ example: 'TEXT' })
  messageType!: string;

  @ApiPropertyOptional({ nullable: true })
  content!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  payload!: Prisma.JsonValue | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  static from(message: MessageRecord): MessageDto {
    return {
      id: message.id,
      roomId: message.roomId,
      senderId: message.senderId,
      messageType: message.messageType,
      content: message.content,
      payload: message.payload,
      createdAt: message.createdAt.toISOString(),
    };
  }
}

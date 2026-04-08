import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Prisma } from '@prisma/client';

export interface PollMessagesQuery {
  roomId: string;
  sinceMessageId?: string;
  timeoutSeconds: number;
}

export interface PollMessagesCommand extends PollMessagesQuery {
  username: string;
  abortSignal?: AbortSignal;
}

export class PollMessageResponse {
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
}

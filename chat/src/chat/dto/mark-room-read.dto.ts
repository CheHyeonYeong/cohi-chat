import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class MarkRoomReadDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Message ID to store as the read cursor. Omit it to mark the latest room message as read.',
  })
  @IsOptional()
  @IsUUID()
  lastReadMessageId?: string;
}

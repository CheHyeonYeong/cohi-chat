import { ApiProperty } from '@nestjs/swagger';
import { Message } from '../entities/message.entity';

export class MessageDto {
  @ApiProperty({ example: 'uuid-v4', description: '메시지 UUID' })
  id: string;

  @ApiProperty({ example: 'uuid-v4', description: '채팅방 UUID' })
  roomId: string;

  @ApiProperty({ example: 'uuid-v4', nullable: true, description: '발신자 UUID. null이면 시스템 메시지' })
  senderId: string | null;

  @ApiProperty({ example: 'TEXT', description: 'TEXT | RESERVATION_CARD | SYSTEM' })
  messageType: string;

  @ApiProperty({ example: '안녕하세요!', nullable: true, description: '메시지 본문. TEXT 타입에서만 존재' })
  content: string | null;

  @ApiProperty({
    nullable: true,
    description: 'RESERVATION_CARD: 예약 스냅샷 / SYSTEM: 메타데이터 / TEXT: null',
    example: null,
  })
  payload: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-03-29T00:00:00.000Z', description: 'ISO 8601 생성 시각' })
  createdAt: string;

  static from(message: Message): MessageDto {
    const dto = new MessageDto();
    dto.id = message.id;
    dto.roomId = message.roomId;
    dto.senderId = message.senderId;
    dto.messageType = message.messageType;
    dto.content = message.content;
    dto.payload = message.payload;
    dto.createdAt = message.createdAt.toISOString();
    return dto;
  }
}

// 커서 페이징 응답 — Spring Page<T>와 달리 단방향(과거 방향) 커서만 제공
export class MessagePageResponse {
  @ApiProperty({ type: [MessageDto] })
  messages: MessageDto[];

  @ApiProperty({ nullable: true, example: '2026-03-28T23:59:00.000Z', description: 'null이면 더 이상 이전 메시지 없음' })
  nextCursor: string | null;
}

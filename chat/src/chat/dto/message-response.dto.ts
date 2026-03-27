import { Message } from '../entities/message.entity';

export class MessageDto {
  id: string;
  roomId: string;
  senderId: string | null;
  messageType: string;
  content: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string; // ISO 8601

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

// 커서 페이징 응답 — Spring Page<T>와 달리 단방향(이전 방향) 커서만 제공
export class MessagePageResponse {
  messages: MessageDto[];
  // 다음 페이지 커서 — null이면 더 이상 이전 메시지 없음
  nextCursor: string | null;
}

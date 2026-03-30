export interface LastMessageDto {
  id: string;
  content: string | null;
  messageType: string;
  createdAt: string;
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
  id: string;
  counterpartId: string;
  counterpartName: string;
  counterpartProfileImageUrl: string | null;
  lastMessage: LastMessageDto | null;
  unreadCount: number;

  static from(row: RoomQueryRow): RoomResponseDto {
    const dto = new RoomResponseDto();
    dto.id = row.id;
    dto.counterpartId = row.counterpart_id;
    dto.counterpartName = row.counterpart_name;
    dto.counterpartProfileImageUrl = row.counterpart_profile_image_url;
    dto.unreadCount = row.unread_count;
    // WHY: 방에 메시지가 없거나 마지막 메시지 메타데이터가 불완전할 수 있어 null-safe하게 응답을 구성합니다.
    // WHY: 날짜는 클라이언트가 타임존과 무관하게 처리할 수 있도록 ISO-8601 문자열로 직렬화합니다.
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

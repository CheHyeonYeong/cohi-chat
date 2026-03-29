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
    dto.lastMessage = row.last_message_id
      ? {
          id: row.last_message_id,
          content: row.last_message_content,
          messageType: row.last_message_type!,
          createdAt: row.last_message_created_at!.toISOString(),
        }
      : null;
    return dto;
  }
}

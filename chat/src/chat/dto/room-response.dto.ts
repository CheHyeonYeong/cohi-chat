import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LastMessageDto {
  @ApiProperty({
    description: '마지막 메시지 ID',
    example: '3f9b0f07-6f68-4cd1-8ae1-1f4ebbf4f9d2',
  })
  id: string;

  @ApiPropertyOptional({
    description: '마지막 메시지 본문. 시스템/카드 메시지는 null일 수 있습니다.',
    nullable: true,
    example: '안녕하세요',
  })
  content: string | null;

  @ApiProperty({ description: '메시지 타입', example: 'TEXT' })
  messageType: string;

  @ApiProperty({
    description: 'UTC 기준 ISO-8601 문자열',
    example: '2026-03-30T00:00:00.000Z',
  })
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
  @ApiProperty({
    description: '채팅방 ID',
    example: '57d8aef0-a2cc-4f18-b673-0ab8f7242f4c',
  })
  id: string;

  @ApiProperty({
    description: '상대방 member ID',
    example: '763f94ea-3f54-42f9-bd1d-96e3516f0a1e',
  })
  counterpartId: string;

  @ApiProperty({ description: '상대방 표시 이름', example: 'Alex Kim' })
  counterpartName: string;

  @ApiPropertyOptional({
    description: '상대방 프로필 이미지 URL',
    nullable: true,
    example: 'https://cdn.example.com/profiles/alex.png',
  })
  counterpartProfileImageUrl: string | null;

  @ApiPropertyOptional({
    description: '마지막 메시지. 메시지가 한 번도 없는 방이면 null입니다.',
    type: () => LastMessageDto,
    nullable: true,
  })
  lastMessage: LastMessageDto | null;

  @ApiProperty({ description: '현재 사용자의 미읽음 메시지 수', example: 3 })
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

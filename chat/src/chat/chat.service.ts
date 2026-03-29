import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RoomMember } from './entities/room-member.entity';
import { RoomQueryRow, RoomResponseDto } from './dto/room-response.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(RoomMember)
    private readonly roomMemberRepository: Repository<RoomMember>,

    private readonly dataSource: DataSource,
  ) {}

  private async getMemberIdByUsername(username: string): Promise<string> {
    const rows: Array<{ id: string }> = await this.dataSource.query(
      `SELECT id FROM member WHERE username = $1`,
      [username],
    );
    if (!rows.length) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    return rows[0].id;
  }

  async getRooms(username: string): Promise<RoomResponseDto[]> {
    const userId = await this.getMemberIdByUsername(username);
    const rows: RoomQueryRow[] = await this.dataSource.query(
      `
      SELECT
        cr.id,
        other_rm.member_id                          AS counterpart_id,
        COALESCE(m.display_name, '')                AS counterpart_name,
        m.profile_image_url                         AS counterpart_profile_image_url,
        last_msg.id                                 AS last_message_id,
        last_msg.content                            AS last_message_content,
        last_msg.message_type                       AS last_message_type,
        last_msg.created_at                         AS last_message_created_at,
        COALESCE(unread.cnt, 0)::int                AS unread_count
      FROM chat_room cr
      JOIN room_member my_rm
        ON my_rm.room_id = cr.id
        AND my_rm.member_id = $1::uuid
        AND my_rm.deleted_at IS NULL
      LEFT JOIN room_member other_rm
        ON other_rm.room_id = cr.id
        AND other_rm.member_id != $1::uuid
        AND other_rm.deleted_at IS NULL
      LEFT JOIN member m ON m.id = other_rm.member_id
      LEFT JOIN LATERAL (
        SELECT id, content, message_type, created_at
        FROM message
        WHERE room_id = cr.id
        ORDER BY created_at DESC
        LIMIT 1
      ) last_msg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt
        FROM message msg
        WHERE msg.room_id = cr.id
          AND (my_rm.last_read_message_id IS NULL
               OR msg.id > my_rm.last_read_message_id)
      ) unread ON true
      WHERE cr.is_disabled = false
      ORDER BY COALESCE(last_msg.created_at, cr.created_at) DESC
      `,
      [userId],
    );

    return rows.map(RoomResponseDto.from);
  }

  async updateReadCursor(
    roomId: string,
    username: string,
    lastReadMessageId: string,
  ): Promise<void> {
    const userId = await this.getMemberIdByUsername(username);

    const member = await this.roomMemberRepository.findOne({
      where: { roomId, memberId: userId },
    });

    if (!member) {
      throw new ForbiddenException('채팅방 접근 권한이 없습니다.');
    }

    await this.roomMemberRepository.update(member.id, { lastReadMessageId });
  }
}

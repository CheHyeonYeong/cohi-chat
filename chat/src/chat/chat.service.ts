import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { RoomMember } from './entities/room-member.entity';
import { MessageDto, MessagePageResponse } from './dto/message-response.dto';
import { RoomResponseDto } from './dto/room-response.dto';

// Spring의 @Service에 대응 — 비즈니스 로직 담당
@Injectable()
export class ChatService {
  constructor(
    // Spring의 @Autowired JpaRepository에 대응
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,

    @InjectRepository(RoomMember)
    private readonly roomMemberRepository: Repository<RoomMember>,

    // 복잡한 JOIN 쿼리를 위한 raw query 실행 — Spring의 EntityManager.createNativeQuery()에 대응
    private readonly dataSource: DataSource,
  ) {}

  // TODO: 요청마다 username → UUID 쿼리가 추가 발생 — 트래픽 증가 시 Redis 캐싱 고려
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
    // NestJS와 Spring이 같은 PostgreSQL DB를 공유하므로 member 테이블 JOIN 가능
    // LATERAL JOIN: room별로 마지막 메시지 1건 + 안읽은 메시지 수를 효율적으로 계산
    const rows: Array<Record<string, unknown>> = await this.dataSource.query(
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
        -- UUID v7 시간 순서 정렬을 이용한 unread 계산
        -- last_read_message_id IS NULL이면 전체가 unread
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

    return rows.map((row) => {
      const dto = new RoomResponseDto();
      dto.id = row.id as string;
      dto.counterpartId = row.counterpart_id as string;
      dto.counterpartName = row.counterpart_name as string;
      dto.counterpartProfileImageUrl = (row.counterpart_profile_image_url as string) ?? null;
      dto.unreadCount = row.unread_count as number;
      dto.lastMessage = row.last_message_id
        ? {
            id: row.last_message_id as string,
            content: (row.last_message_content as string) ?? null,
            messageType: row.last_message_type as string,
            createdAt: (row.last_message_created_at as Date).toISOString(),
          }
        : null;
      return dto;
    });
  }

  async getMessages(
    roomId: string,
    username: string,
    cursor: string | undefined,
    size: number,
  ): Promise<MessagePageResponse> {
    const userId = await this.getMemberIdByUsername(username);

    // 권한 체크: JWT userId가 해당 roomId의 RoomMember인지 확인
    // @DeleteDateColumn 선언으로 TypeORM이 자동으로 WHERE deleted_at IS NULL을 추가함
    const member = await this.roomMemberRepository.findOne({
      where: { roomId, memberId: userId },
    });

    if (!member) {
      throw new NotFoundException('채팅방을 찾을 수 없거나 접근 권한이 없습니다.');
    }

    const messages = await this.messageRepository.find({
      where: {
        roomId,
        ...(cursor ? { createdAt: LessThan(new Date(cursor)) } : {}),
      },
      order: { createdAt: 'DESC' },
      take: size,
    });

    const nextCursor =
      messages.length === size
        ? messages[messages.length - 1].createdAt.toISOString()
        : null;

    return {
      messages: messages.map(MessageDto.from),
      nextCursor,
    };
  }
}

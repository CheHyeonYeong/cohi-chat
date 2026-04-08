import { Prisma } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MarkRoomAsReadResponseDto,
  UnreadSummaryResponseDto,
} from './dto/chat-response.dto';
import { RoomQueryRow, RoomResponseDto } from './dto/room-response.dto';

interface MembershipUnreadRow {
  room_id: string;
  unread_count: number;
}

@Injectable()
export class ChatService {
  private static readonly UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(private readonly prisma: PrismaService) {}

  async getRooms(memberIdentifier: string): Promise<RoomResponseDto[]> {
    const memberId = await this.resolveMemberId(memberIdentifier);
    const accessibleRoomIds = await this.getAccessibleRoomIds(memberId);
    if (accessibleRoomIds.size === 0) {
      return [];
    }

    const rows = await this.prisma.$queryRaw<RoomQueryRow[]>(Prisma.sql`
      SELECT
        cr.id,
        counterpart.member_id                       AS counterpart_id,
        COALESCE(counterpart.display_name, '')     AS counterpart_name,
        counterpart.profile_image_url              AS counterpart_profile_image_url,
        my_rm.last_read_message_id::text           AS last_read_message_id,
        last_msg.id                                AS last_message_id,
        last_msg.content                           AS last_message_content,
        last_msg.message_type                      AS last_message_type,
        last_msg.created_at                        AS last_message_created_at,
        COALESCE(unread.cnt, 0)::int               AS unread_count
      FROM chat_room cr
      JOIN room_member my_rm
        ON my_rm.room_id = cr.id
       AND my_rm.member_id = CAST(${memberId} AS UUID)
       AND my_rm.deleted_at IS NULL
      JOIN LATERAL (
        SELECT
          rm.member_id,
          COALESCE(m.display_name, m.username, '') AS display_name,
          m.profile_image_url
        FROM room_member rm
        JOIN member m
          ON m.id = rm.member_id
         AND m.is_deleted = false
         AND m.is_banned = false
        WHERE rm.room_id = cr.id
          AND rm.member_id != CAST(${memberId} AS UUID)
          AND rm.deleted_at IS NULL
        ORDER BY rm.created_at ASC, rm.id ASC
        LIMIT 1
      ) counterpart ON true
      LEFT JOIN LATERAL (
        SELECT id, content, message_type, created_at
        FROM message
        WHERE room_id = cr.id
        ORDER BY cursor_seq DESC, created_at DESC, id DESC
        LIMIT 1
      ) last_msg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt
        FROM message msg
        LEFT JOIN message cursor_message
          ON cursor_message.id = my_rm.last_read_message_id
         AND cursor_message.room_id = cr.id
        WHERE msg.room_id = cr.id
          AND (
            cursor_message.cursor_seq IS NULL
            OR msg.cursor_seq > cursor_message.cursor_seq
          )
      ) unread ON true
      WHERE cr.is_disabled = false
        AND cr.deleted_at IS NULL
        AND cr.id IN (${Prisma.join(
          [...accessibleRoomIds].map((id) => Prisma.sql`CAST(${id} AS UUID)`),
        )})
      ORDER BY COALESCE(last_msg.created_at, cr.created_at) DESC, cr.id DESC
    `);

    return rows.map((row) => RoomResponseDto.from(row));
  }

  async getUnreadSummary(
    memberIdentifier: string,
  ): Promise<UnreadSummaryResponseDto> {
    const memberId = await this.resolveMemberId(memberIdentifier);
    const memberships = await this.getActiveMemberships(memberId);
    if (memberships.length === 0) {
      return {
        totalUnread: 0,
        rooms: [],
      };
    }

    const unreadCounts = await this.getUnreadCounts(memberships);
    const rooms = memberships.map((membership) => ({
      roomId: membership.roomId,
      unreadCount: unreadCounts.get(membership.roomId) ?? 0,
    }));

    return {
      totalUnread: rooms.reduce((total, room) => total + room.unreadCount, 0),
      rooms: rooms
        .filter((room) => room.unreadCount > 0)
        .sort((left, right) => right.unreadCount - left.unreadCount),
    };
  }

  async markRoomAsRead(
    memberIdentifier: string,
    roomId: string,
  ): Promise<MarkRoomAsReadResponseDto> {
    const memberId = await this.resolveMemberId(memberIdentifier);
    const accessibleRoomIds = await this.getAccessibleRoomIds(memberId);
    if (!accessibleRoomIds.has(roomId)) {
      throw new NotFoundException('Accessible chat room not found.');
    }

    const membership = await this.prisma.roomMember.findFirst({
      where: {
        roomId,
        memberId,
        deletedAt: null,
      },
    });
    if (!membership) {
      throw new NotFoundException('Accessible chat room not found.');
    }

    const latestMessage = await this.findLastMessage(roomId);
    const nextLastReadMessageId = latestMessage?.id ?? null;

    if (membership.lastReadMessageId !== nextLastReadMessageId) {
      await this.prisma.roomMember.update({
        where: {
          id: membership.id,
        },
        data: {
          lastReadMessageId: nextLastReadMessageId,
        },
      });
    }

    return {
      roomId,
      lastReadMessageId: nextLastReadMessageId,
      unreadCount: 0,
    };
  }

  private async resolveMemberId(memberIdentifier: string): Promise<string> {
    const lookupCondition = ChatService.UUID_PATTERN.test(memberIdentifier)
      ? Prisma.sql`id = CAST(${memberIdentifier} AS UUID)`
      : Prisma.sql`username = ${memberIdentifier}`;

    const members = await this.prisma.$queryRaw<
      Array<{ id: string }>
    >(Prisma.sql`
      SELECT id::text AS id
      FROM member
      WHERE ${lookupCondition}
        AND is_deleted = false
        AND is_banned = false
      LIMIT 1
    `);
    const member = members[0];
    if (!member) {
      throw new UnauthorizedException('Authenticated member not found.');
    }

    return member.id;
  }

  private async getAccessibleRoomIds(memberId: string): Promise<Set<string>> {
    const rooms = await this.prisma.$queryRaw<Array<{ room_id: string }>>(
      Prisma.sql`
        SELECT DISTINCT cr.id::text AS room_id
        FROM chat_room cr
        JOIN room_member my_rm
          ON my_rm.room_id = cr.id
         AND my_rm.member_id = CAST(${memberId} AS UUID)
         AND my_rm.deleted_at IS NULL
        WHERE cr.is_disabled = false
          AND cr.deleted_at IS NULL
          AND EXISTS (
            SELECT 1
            FROM room_member rm
            JOIN member m
              ON m.id = rm.member_id
             AND m.is_deleted = false
             AND m.is_banned = false
            WHERE rm.room_id = cr.id
              AND rm.member_id != CAST(${memberId} AS UUID)
              AND rm.deleted_at IS NULL
          )
      `,
    );

    return new Set(rooms.map((room) => room.room_id));
  }

  private async getActiveMemberships(memberId: string) {
    const accessibleRoomIds = await this.getAccessibleRoomIds(memberId);
    if (accessibleRoomIds.size === 0) {
      return [];
    }

    const memberships = await this.prisma.roomMember.findMany({
      where: {
        memberId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    if (memberships.length === 0) {
      return [];
    }

    return memberships.filter((membership) =>
      accessibleRoomIds.has(membership.roomId),
    );
  }

  private async findLastMessage(roomId: string) {
    return this.prisma.message.findFirst({
      select: {
        id: true,
      },
      where: {
        roomId,
      },
      orderBy: {
        cursorSeq: 'desc',
      },
    });
  }

  private async getUnreadCounts(
    memberships: Array<{ roomId: string; lastReadMessageId: string | null }>,
  ): Promise<Map<string, number>> {
    const membershipValues = Prisma.join(
      memberships.map(
        (membership) => Prisma.sql`
        (
          CAST(${membership.roomId} AS UUID),
          CAST(${membership.lastReadMessageId} AS UUID)
        )
      `,
      ),
    );

    const rows = await this.prisma.$queryRaw<MembershipUnreadRow[]>(
      Prisma.sql`
        WITH target_memberships(room_id, last_read_message_id) AS (
          VALUES ${membershipValues}
        )
        SELECT
          tm.room_id::text AS room_id,
          COUNT(msg.id)::int AS unread_count
        FROM target_memberships tm
        LEFT JOIN message cursor_message
          ON cursor_message.id = tm.last_read_message_id
         AND cursor_message.room_id = tm.room_id
        LEFT JOIN message msg
          ON msg.room_id = tm.room_id
         AND (
           cursor_message.cursor_seq IS NULL
           OR msg.cursor_seq > cursor_message.cursor_seq
         )
        GROUP BY tm.room_id
      `,
    );

    return new Map(rows.map((row) => [row.room_id, row.unread_count]));
  }
}

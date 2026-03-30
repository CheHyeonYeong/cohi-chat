import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomQueryRow, RoomResponseDto } from './dto/room-response.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getRooms(username: string): Promise<RoomResponseDto[]> {
    // Keep this query in SQL because the room list contract depends on
    // lateral joins and window functions that are easier to keep exact here
    // than to spread across multiple ORM calls and post-processing steps.
    const rows = await this.prisma.$queryRaw<RoomQueryRow[]>(Prisma.sql`
      SELECT
        cr.id,
        counterpart.member_id                       AS counterpart_id,
        COALESCE(counterpart.display_name, '')     AS counterpart_name,
        counterpart.profile_image_url              AS counterpart_profile_image_url,
        last_msg.id                                AS last_message_id,
        last_msg.content                           AS last_message_content,
        last_msg.message_type                      AS last_message_type,
        last_msg.created_at                        AS last_message_created_at,
        COALESCE(unread.cnt, 0)::int               AS unread_count
      FROM chat_room cr
      JOIN member me
        ON me.username = ${username}
       AND me.is_deleted = false
       AND me.is_banned = false
      JOIN room_member my_rm
        ON my_rm.room_id = cr.id
       AND my_rm.member_id = me.id
       AND my_rm.deleted_at IS NULL
      -- Pick exactly one counterpart row for a 1:1 room without duplicating
      -- the parent room row in the result set.
      JOIN LATERAL (
        SELECT
          rm.member_id,
          COALESCE(m.display_name, m.username, '') AS display_name,
          m.profile_image_url
        FROM room_member rm
        LEFT JOIN member m ON m.id = rm.member_id
        WHERE rm.room_id = cr.id
          AND rm.member_id != me.id
          AND rm.deleted_at IS NULL
        ORDER BY rm.created_at ASC, rm.id ASC
        LIMIT 1
      ) counterpart ON true
      -- Fetch only the latest message per room so the list stays compact while
      -- still showing the most recent activity preview.
      LEFT JOIN LATERAL (
        SELECT id, content, message_type, created_at
        FROM message
        WHERE room_id = cr.id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      ) last_msg ON true
      -- Compute unread counts by assigning a stable sequence per room and then
      -- counting only rows that come after the stored last-read cursor.
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS cnt
        FROM (
          SELECT
            msg.id,
            ROW_NUMBER() OVER (ORDER BY msg.created_at ASC, msg.id ASC) AS seq
          FROM message msg
          WHERE msg.room_id = cr.id
        ) ordered_message
        LEFT JOIN LATERAL (
          SELECT cursor_message.seq
          FROM (
            SELECT
              msg.id,
              ROW_NUMBER() OVER (ORDER BY msg.created_at ASC, msg.id ASC) AS seq
            FROM message msg
            WHERE msg.room_id = cr.id
          ) cursor_message
          WHERE cursor_message.id = my_rm.last_read_message_id
        ) cursor ON true
        WHERE cursor.seq IS NULL OR ordered_message.seq > cursor.seq
      ) unread ON true
      WHERE cr.is_disabled = false
      -- Sort by recent activity first, then by room id as a deterministic
      -- tie-breaker when timestamps are equal or the room has no messages yet.
      ORDER BY COALESCE(last_msg.created_at, cr.created_at) DESC, cr.id DESC
    `);

    // The SQL aliases intentionally mirror RoomQueryRow so DTO mapping stays
    // thin and the response contract is centralized in RoomResponseDto.from().
    return rows.map((row) => RoomResponseDto.from(row));
  }
}

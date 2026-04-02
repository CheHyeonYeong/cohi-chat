import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  encodeMessageCursor,
  MessageCursor,
} from './message-cursor';
import { MessageDto, MessagePageResponse } from './dto/message-response.dto';
import { RoomQueryRow, RoomResponseDto } from './dto/room-response.dto';
import { SendMessageDto } from './dto/send-message.dto';

const MESSAGE_MAX_LENGTH = 1000;

type MessageRow = {
  id: string;
  roomId: string;
  senderId: string | null;
  messageType: string;
  content: string | null;
  payload: unknown;
  createdAt: Date;
  cursorCreatedAt: string;
};

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getRooms(username: string): Promise<RoomResponseDto[]> {
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
      LEFT JOIN LATERAL (
        SELECT id, content, message_type, created_at
        FROM message
        WHERE room_id = cr.id
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      ) last_msg ON true
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
      ORDER BY COALESCE(last_msg.created_at, cr.created_at) DESC, cr.id DESC
    `);

    return rows.map((row) => RoomResponseDto.from(row));
  }

  async sendMessage(
    roomId: string,
    username: string,
    dto: SendMessageDto,
  ): Promise<MessageDto> {
    const normalizedContent = this.normalizeContent(dto.content);
    const memberId = await this.resolveMemberId(username);
    const roomMember = await this.ensureActiveRoomMember(roomId, memberId);

    const savedMessage = await this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          roomId,
          senderId: memberId,
          messageType: 'TEXT',
          content: normalizedContent,
        },
      });

      await tx.roomMember.update({
        where: { id: roomMember.id },
        data: { lastReadMessageId: message.id },
      });

      return message;
    });

    return MessageDto.from(savedMessage);
  }

  async getMessages(
    roomId: string,
    username: string,
    cursor: MessageCursor | undefined,
    size: number,
  ): Promise<MessagePageResponse> {
    const memberId = await this.resolveMemberId(username);
    await this.ensureActiveRoomMember(roomId, memberId);

    const rows = await this.fetchMessagesPage(roomId, cursor, size);
    return {
      messages: rows.messages.map((message) => MessageDto.from(message)),
      nextCursor: rows.nextCursor,
    };
  }

  private async resolveMemberId(username: string): Promise<string> {
    const member = await this.prisma.member.findFirst({
      where: {
        username,
        isDeleted: false,
        isBanned: false,
      },
      select: { id: true },
    });

    if (!member) {
      throw new UnauthorizedException('The authenticated user does not exist.');
    }

    return member.id;
  }

  private async ensureActiveRoomMember(
    roomId: string,
    memberId: string,
  ): Promise<{ id: string }> {
    const roomMember = await this.prisma.roomMember.findFirst({
      where: {
        roomId,
        memberId,
        deletedAt: null,
        room: {
          isDisabled: false,
        },
      },
      select: { id: true },
    });

    if (!roomMember) {
      throw new ForbiddenException('Access to the chat room is denied.');
    }

    return roomMember;
  }

  private normalizeContent(content: unknown): string {
    if (typeof content !== 'string') {
      throw new BadRequestException('Message content must be a string.');
    }

    const normalizedContent = content.trim();

    if (normalizedContent.length === 0) {
      throw new BadRequestException('Message content cannot be blank.');
    }

    if (normalizedContent.length > MESSAGE_MAX_LENGTH) {
      throw new BadRequestException(
        `Message content cannot exceed ${MESSAGE_MAX_LENGTH} characters.`,
      );
    }

    return normalizedContent;
  }

  private async fetchMessagesPage(
    roomId: string,
    cursor: MessageCursor | undefined,
    size: number,
  ): Promise<{ messages: MessageRow[]; nextCursor: string | null }> {
    const rows = await this.fetchMessagesBatch(roomId, cursor, size + 1);

    if (rows.length <= size) {
      return { messages: rows, nextCursor: null };
    }

    const pageRows = rows.slice(0, size);
    const lastVisibleRow = pageRows[pageRows.length - 1];

    return {
      messages: pageRows,
      nextCursor: encodeMessageCursor({
        createdAt: lastVisibleRow.cursorCreatedAt,
        id: lastVisibleRow.id,
      }),
    };
  }

  private async fetchMessagesBatch(
    roomId: string,
    cursor: MessageCursor | undefined,
    take: number,
  ): Promise<MessageRow[]> {
    const cursorFilter = cursor
      ? Prisma.sql`
          AND (
            m.created_at < ${cursor.createdAt}::timestamptz
            OR (
              m.created_at = ${cursor.createdAt}::timestamptz
              AND m.id < ${cursor.id}::uuid
            )
          )
        `
      : Prisma.empty;

    return this.prisma.$queryRaw<MessageRow[]>(Prisma.sql`
      SELECT
        m.id,
        m.room_id AS "roomId",
        m.sender_id AS "senderId",
        m.message_type AS "messageType",
        m.content,
        m.payload,
        m.created_at AS "createdAt",
        to_char(
          m.created_at AT TIME ZONE 'UTC',
          'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
        ) AS "cursorCreatedAt"
      FROM message m
      WHERE m.room_id = ${roomId}::uuid
      ${cursorFilter}
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT ${take}
    `);
  }
}
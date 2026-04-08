import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChatRoomActivityNotifier } from './chat-room-activity-notifier';
import { MessageDto, MessagePageResponse } from './dto/message-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MESSAGE_MAX_LENGTH } from './message.constants';
import { encodeMessageCursor, MessageCursor } from './message-cursor';

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

type MemberLookupClient = {
  member: {
    findFirst: PrismaService['member']['findFirst'];
  };
};

type RoomMemberLookupClient = {
  roomMember: {
    findFirst: PrismaService['roomMember']['findFirst'];
  };
};

type MessageQueryClient = {
  $queryRaw: PrismaService['$queryRaw'];
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly roomActivityNotifier: ChatRoomActivityNotifier,
  ) {}

  async sendMessage(
    roomId: string,
    username: string,
    dto: SendMessageDto,
  ): Promise<MessageDto> {
    const normalizedContent = this.normalizeContent(dto.content);

    const savedMessage = await this.prisma.$transaction(
      async (tx) => {
        const memberId = await this.resolveMemberId(tx, username);
        const roomMember = await this.findActiveRoomMember(tx, roomId, memberId);
        if (!roomMember) {
          throw new ForbiddenException('Access to the chat room is denied.');
        }

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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.notifyRoomActivity(roomId);

    return MessageDto.from(savedMessage);
  }

  async getMessages(
    roomId: string,
    username: string,
    cursor: MessageCursor | undefined,
    size: number,
  ): Promise<MessagePageResponse> {
    return this.prisma.$transaction(
      async (tx) => {
        const memberId = await this.resolveMemberId(tx, username);
        await this.ensureActiveRoomMember(tx, roomId, memberId);

        const rows = await this.fetchMessagesPage(tx, roomId, cursor, size);
        return {
          messages: rows.messages.map((message) => MessageDto.from(message)),
          nextCursor: rows.nextCursor,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async resolveMemberId(
    client: MemberLookupClient,
    username: string,
  ): Promise<string> {
    const member = await client.member.findFirst({
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
    client: RoomMemberLookupClient,
    roomId: string,
    memberId: string,
  ): Promise<void> {
    const roomMember = await this.findActiveRoomMember(client, roomId, memberId);

    if (!roomMember) {
      throw new ForbiddenException('Access to the chat room is denied.');
    }
  }

  private async findActiveRoomMember(
    client: RoomMemberLookupClient,
    roomId: string,
    memberId: string,
  ): Promise<{ id: string } | null> {
    return client.roomMember.findFirst({
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

  private async notifyRoomActivity(roomId: string): Promise<void> {
    try {
      await this.roomActivityNotifier.notifyRoomActivity(roomId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `notifyRoomActivity failed after message commit for room ${roomId}: ${message}`,
      );
    }
  }

  private async fetchMessagesPage(
    client: MessageQueryClient,
    roomId: string,
    cursor: MessageCursor | undefined,
    size: number,
  ): Promise<{ messages: MessageRow[]; nextCursor: string | null }> {
    const rows = await this.fetchMessagesBatch(client, roomId, cursor, size + 1);

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
    client: MessageQueryClient,
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

    return client.$queryRaw<MessageRow[]>(Prisma.sql`
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

import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChatPollRegistry,
  type PollWaitSubscription,
} from './chat-poll-registry';
import { MESSAGE_MAX_LENGTH } from './chat.constants';
import { MessageDto } from './dto/message-response.dto';
import { ListRoomMessagesQuery } from './dto/list-room-messages.dto';
import { ReadStateDto } from './dto/read-state-response.dto';
import { MarkRoomReadDto } from './dto/mark-room-read.dto';
import {
  PollMessageResponse,
  PollMessagesCommand,
} from './dto/poll-messages.dto';
import { RoomQueryRow, RoomResponseDto } from './dto/room-response.dto';
import { SendMessageDto } from './dto/send-message.dto';

interface PollingMessageRecord {
  id: string;
  roomId: string;
  senderId: string | null;
  messageType: string;
  content: string | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
}

export const MAX_POLL_TIMEOUT_SECONDS = 25;
export const POLL_TIMEOUT_BUFFER_SECONDS = 10;
export const RECOMMENDED_POLL_REQUEST_TIMEOUT_SECONDS =
  MAX_POLL_TIMEOUT_SECONDS + POLL_TIMEOUT_BUFFER_SECONDS;
export const MAX_POLL_MESSAGES = 100;
export const DEFAULT_ROOM_MESSAGE_LIMIT = 50;
export const MAX_ROOM_MESSAGE_LIMIT = 100;

type RoomMembershipRecord = {
  id: string;
  lastReadMessageId: string | null;
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pollRegistry: ChatPollRegistry,
  ) {}

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
    const roomMember = await this.getAccessibleMembership(roomId, memberId);

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
        where: {
          id: roomMember.id,
        },
        data: {
          lastReadMessageId: message.id,
        },
      });

      return message;
    });

    this.pollRegistry.notifyRoom(roomId);

    return MessageDto.from(savedMessage);
  }

  async getRoomMessages(
    roomId: string,
    username: string,
    query: ListRoomMessagesQuery,
  ): Promise<MessageDto[]> {
    this.validateMessageLimit(query.limit);

    const memberId = await this.resolveMemberId(username);
    await this.getAccessibleMembership(roomId, memberId);

    const messages = query.beforeMessageId
      ? await this.findMessagesBefore(roomId, query.beforeMessageId, query.limit)
      : await this.findRecentMessages(roomId, query.limit);

    return messages.map((message) => MessageDto.from(message));
  }

  async markRoomRead(
    roomId: string,
    username: string,
    dto: MarkRoomReadDto,
  ): Promise<ReadStateDto> {
    const memberId = await this.resolveMemberId(username);
    const membership = await this.getAccessibleMembership(roomId, memberId);

    const lastReadMessageId = dto.lastReadMessageId
      ? await this.requireRoomMessage(roomId, dto.lastReadMessageId)
      : await this.findLatestRoomMessageId(roomId);

    await this.prisma.roomMember.update({
      where: {
        id: membership.id,
      },
      data: {
        lastReadMessageId,
      },
    });

    return {
      roomId,
      lastReadMessageId,
      unreadCount: await this.countUnreadMessages(roomId, lastReadMessageId),
    };
  }

  async pollMessages({
    roomId,
    sinceMessageId,
    timeoutSeconds,
    username,
    abortSignal,
  }: PollMessagesCommand): Promise<PollMessageResponse[]> {
    this.validateTimeout(timeoutSeconds);

    const memberId = await this.resolveMemberId(username);
    await this.getAccessibleMembership(roomId, memberId);

    const pollingStartedAt = new Date();
    const subscription =
      timeoutSeconds === 0
        ? undefined
        : this.pollRegistry.createRoomSubscription(
            roomId,
            timeoutSeconds * 1000,
            abortSignal,
          );

    try {
      const messages = await this.findMessagesAfter(
        roomId,
        sinceMessageId,
        pollingStartedAt,
      );
      if (messages.length > 0 || timeoutSeconds === 0) {
        return messages.map((message) => this.toPollMessageResponse(message));
      }

      const waitResult = await this.waitForMessages(subscription);
      if (waitResult !== 'notified') {
        return [];
      }

      const waitedMessages = await this.findMessagesAfter(
        roomId,
        sinceMessageId,
        pollingStartedAt,
      );

      return waitedMessages.map((message) =>
        this.toPollMessageResponse(message),
      );
    } finally {
      subscription?.cancel();
    }
  }

  private async resolveMemberId(username: string): Promise<string> {
    const member = await this.prisma.member.findFirst({
      where: {
        username,
        isDeleted: false,
        isBanned: false,
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      throw new UnauthorizedException('The authenticated user does not exist.');
    }

    return member.id;
  }

  private async getAccessibleMembership(
    roomId: string,
    memberId: string,
  ): Promise<RoomMembershipRecord> {
    const roomMember = await this.prisma.roomMember.findFirst({
      where: {
        roomId,
        memberId,
        deletedAt: null,
      },
      select: {
        id: true,
        lastReadMessageId: true,
      },
    });

    if (!roomMember) {
      throw new ForbiddenException('Access to the chat room is denied.');
    }

    const room = await this.prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        isDisabled: false,
      },
      select: {
        id: true,
      },
    });

    if (!room) {
      throw new ForbiddenException('Access to the chat room is denied.');
    }

    return roomMember;
  }

  private validateMessageLimit(limit: number): void {
    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > MAX_ROOM_MESSAGE_LIMIT
    ) {
      throw new BadRequestException(
        `limit must be an integer between 1 and ${MAX_ROOM_MESSAGE_LIMIT}.`,
      );
    }
  }

  private validateTimeout(timeoutSeconds: number): void {
    if (
      !Number.isInteger(timeoutSeconds) ||
      timeoutSeconds < 0 ||
      timeoutSeconds > MAX_POLL_TIMEOUT_SECONDS
    ) {
      throw new BadRequestException(
        `timeout must be an integer between 0 and ${MAX_POLL_TIMEOUT_SECONDS}.`,
      );
    }
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

  private async findRecentMessages(
    roomId: string,
    limit: number,
  ): Promise<PollingMessageRecord[]> {
    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    return [...messages].reverse();
  }

  private async findMessagesBefore(
    roomId: string,
    beforeMessageId: string,
    limit: number,
  ): Promise<PollingMessageRecord[]> {
    const anchorMessage = await this.findRoomMessageAnchor(roomId, beforeMessageId);
    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
        OR: [
          {
            createdAt: {
              lt: anchorMessage.createdAt,
            },
          },
          {
            createdAt: anchorMessage.createdAt,
            id: {
              lt: anchorMessage.id,
            },
          },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    return [...messages].reverse();
  }

  private async findMessagesAfter(
    roomId: string,
    sinceMessageId: string | undefined,
    pollingStartedAt: Date,
  ): Promise<PollingMessageRecord[]> {
    if (!sinceMessageId) {
      return this.prisma.message.findMany({
        where: {
          roomId,
          createdAt: {
            gt: pollingStartedAt,
          },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: MAX_POLL_MESSAGES,
      });
    }

    const anchorMessage = await this.findRoomMessageAnchor(roomId, sinceMessageId);

    // Include the anchor in the query window, then drop it in memory so
    // same-timestamp messages are not skipped by the secondary id ordering.
    const orderedMessages = await this.prisma.message.findMany({
      where: {
        roomId,
        createdAt: {
          gte: anchorMessage.createdAt,
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: MAX_POLL_MESSAGES + 1,
    });

    return orderedMessages
      .filter((message) => message.id !== anchorMessage.id)
      .slice(0, MAX_POLL_MESSAGES);
  }

  private async findRoomMessageAnchor(
    roomId: string,
    messageId: string,
  ): Promise<Pick<PollingMessageRecord, 'id' | 'createdAt'>> {
    const anchorMessage = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        roomId,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (!anchorMessage) {
      throw new BadRequestException(
        'The message cursor does not belong to the specified room.',
      );
    }

    return anchorMessage;
  }

  private async requireRoomMessage(
    roomId: string,
    messageId: string,
  ): Promise<string> {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        roomId,
      },
      select: {
        id: true,
      },
    });

    if (!message) {
      throw new BadRequestException(
        'lastReadMessageId does not belong to the specified room.',
      );
    }

    return message.id;
  }

  private async findLatestRoomMessageId(roomId: string): Promise<string | null> {
    const latestMessage = await this.prisma.message.findFirst({
      where: {
        roomId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
      },
    });

    return latestMessage?.id ?? null;
  }

  private async countUnreadMessages(
    roomId: string,
    lastReadMessageId: string | null,
  ): Promise<number> {
    if (!lastReadMessageId) {
      return this.prisma.message.count({
        where: {
          roomId,
        },
      });
    }

    const anchorMessage = await this.findRoomMessageAnchor(roomId, lastReadMessageId);

    return this.prisma.message.count({
      where: {
        roomId,
        OR: [
          {
            createdAt: {
              gt: anchorMessage.createdAt,
            },
          },
          {
            createdAt: anchorMessage.createdAt,
            id: {
              gt: anchorMessage.id,
            },
          },
        ],
      },
    });
  }

  private waitForMessages(
    subscription: PollWaitSubscription | undefined,
  ): Promise<'notified' | 'timed_out' | 'aborted'> {
    if (!subscription) {
      return Promise.resolve('timed_out');
    }

    return subscription.completion;
  }

  private toPollMessageResponse(
    message: PollingMessageRecord,
  ): PollMessageResponse {
    return {
      id: message.id,
      roomId: message.roomId,
      senderId: message.senderId,
      messageType: message.messageType,
      content: message.content,
      payload: message.payload,
      createdAt: message.createdAt.toISOString(),
    };
  }
}

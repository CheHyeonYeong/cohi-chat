import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChatRoomResponseDto,
  MarkRoomAsReadResponseDto,
  UnreadSummaryResponseDto,
} from './dto/chat-response.dto';

@Injectable()
export class ChatService {
  private static readonly UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(private readonly prisma: PrismaService) {}

  async listRooms(memberIdentifier: string): Promise<ChatRoomResponseDto[]> {
    const memberId = await this.resolveMemberId(memberIdentifier);
    const memberships = await this.getActiveMemberships(memberId);
    if (memberships.length === 0) {
      return [];
    }

    const roomIds = memberships.map((membership) => membership.roomId);
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        id: { in: roomIds },
        deletedAt: null,
      },
    });
    const roomMap = new Map(rooms.map((room) => [room.id, room]));

    const roomsWithMetadata = await Promise.all(
      memberships
        .filter((membership) => roomMap.has(membership.roomId))
        .map(async (membership) => {
          const room = roomMap.get(membership.roomId);
          if (!room) {
            return null;
          }

          const [lastMessage, unreadCount] = await Promise.all([
            this.findLastMessage(room.id),
            this.getUnreadCount(room.id, membership.lastReadMessageId),
          ]);

          return {
            roomId: room.id,
            type: room.type,
            status: room.status,
            externalRefType: room.externalRefType,
            externalRefId: room.externalRefId,
            lastReadMessageId: membership.lastReadMessageId,
            unreadCount,
            lastMessage: lastMessage
              ? {
                  id: lastMessage.id,
                  senderId: lastMessage.senderId,
                  messageType: lastMessage.messageType,
                  content: lastMessage.content,
                  createdAt: lastMessage.createdAt.toISOString(),
                }
              : null,
            sortKey: lastMessage?.createdAt ?? room.updatedAt,
          };
        }),
    );

    return roomsWithMetadata
      .filter((room): room is NonNullable<typeof room> => room !== null)
      .sort((left, right) => right.sortKey.getTime() - left.sortKey.getTime())
      .map((roomWithSortKey) => {
        const { sortKey, ...room } = roomWithSortKey;
        void sortKey;
        return room;
      });
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

    const rooms = await Promise.all(
      memberships.map(async (membership) => ({
        roomId: membership.roomId,
        unreadCount: await this.getUnreadCount(
          membership.roomId,
          membership.lastReadMessageId,
        ),
      })),
    );

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
    const room = await this.prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        deletedAt: null,
      },
    });
    if (!room) {
      throw new NotFoundException('접근 가능한 채팅방을 찾을 수 없습니다.');
    }

    const membership = await this.prisma.roomMember.findFirst({
      where: {
        roomId,
        memberId,
        deletedAt: null,
      },
    });
    if (!membership) {
      throw new NotFoundException('접근 가능한 채팅방을 찾을 수 없습니다.');
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
    if (ChatService.UUID_PATTERN.test(memberIdentifier)) {
      return memberIdentifier;
    }

    const members = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id
      FROM member
      WHERE username = ${memberIdentifier}
        AND is_deleted = false
        AND is_banned = false
      LIMIT 1
    `;
    const member = members[0];
    if (!member) {
      throw new NotFoundException(
        '인증된 사용자의 회원 정보를 찾을 수 없습니다.',
      );
    }

    return member.id;
  }

  private async getActiveMemberships(memberId: string) {
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

    const activeRooms = await this.prisma.chatRoom.findMany({
      where: {
        id: { in: memberships.map((membership) => membership.roomId) },
        deletedAt: null,
      },
    });
    const activeRoomIds = new Set(activeRooms.map((room) => room.id));

    return memberships.filter((membership) =>
      activeRoomIds.has(membership.roomId),
    );
  }

  private async findLastMessage(roomId: string) {
    return this.prisma.message.findFirst({
      where: {
        roomId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  private async getUnreadCount(
    roomId: string,
    lastReadMessageId: string | null,
  ): Promise<number> {
    if (!lastReadMessageId) {
      return this.prisma.message.count({
        where: { roomId },
      });
    }

    const lastReadMessage = await this.prisma.message.findUnique({
      where: {
        id: lastReadMessageId,
      },
    });
    if (!lastReadMessage || lastReadMessage.roomId !== roomId) {
      return this.prisma.message.count({
        where: { roomId },
      });
    }

    return this.prisma.message.count({
      where: {
        roomId,
        OR: [
          {
            createdAt: {
              gt: lastReadMessage.createdAt,
            },
          },
          {
            createdAt: lastReadMessage.createdAt,
            id: {
              gt: lastReadMessageId,
            },
          },
        ],
      },
    });
  }
}

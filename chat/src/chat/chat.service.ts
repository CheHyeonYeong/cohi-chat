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

@Injectable()
export class ChatService {
  private static readonly UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(private readonly prisma: PrismaService) {}

  async getRooms(memberIdentifier: string): Promise<RoomResponseDto[]> {
    const memberId = await this.resolveMemberId(memberIdentifier);
    const memberships = await this.getAccessibleMemberships(memberId);
    if (memberships.length === 0) {
      return [];
    }

    const unreadCounts = await this.getUnreadCounts(
      memberships.map((membership) => ({
        roomId: membership.roomId,
        lastReadMessageId: membership.lastReadMessageId,
      })),
    );

    const rows = memberships
      .map((membership) => {
        const counterpart = membership.room.members[0];
        if (!counterpart?.member) {
          return null;
        }

        const lastMessage = membership.room.messages[0] ?? null;
        const row: RoomQueryRow = {
          id: membership.room.id,
          counterpart_id: counterpart.memberId,
          counterpart_name:
            counterpart.member.displayName || counterpart.member.username || '',
          counterpart_profile_image_url: counterpart.member.profileImageUrl,
          last_read_message_id: membership.lastReadMessageId,
          last_message_id: lastMessage?.id ?? null,
          last_message_content: lastMessage?.content ?? null,
          last_message_type: lastMessage?.messageType ?? null,
          last_message_created_at: lastMessage?.createdAt ?? null,
          unread_count: unreadCounts.get(membership.roomId) ?? 0,
        };

        return {
          row,
          sortDate: lastMessage?.createdAt ?? membership.room.createdAt,
          roomId: membership.room.id,
        };
      })
      .filter(
        (
          item,
        ): item is {
          row: RoomQueryRow;
          sortDate: Date;
          roomId: string;
        } => item !== null,
      )
      .sort((left, right) => {
        const dateDiff = right.sortDate.getTime() - left.sortDate.getTime();
        if (dateDiff !== 0) {
          return dateDiff;
        }

        return right.roomId.localeCompare(left.roomId);
      });

    return rows.map((item) => RoomResponseDto.from(item.row));
  }

  async getUnreadSummary(
    memberIdentifier: string,
  ): Promise<UnreadSummaryResponseDto> {
    const memberId = await this.resolveMemberId(memberIdentifier);
    const memberships = await this.getAccessibleMemberships(memberId);
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
    const membership = await this.findAccessibleMembership(memberId, roomId);
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
    const member = await this.prisma.member.findFirst({
      where: ChatService.UUID_PATTERN.test(memberIdentifier)
        ? {
            id: memberIdentifier,
            isDeleted: false,
            isBanned: false,
          }
        : {
            username: memberIdentifier,
            isDeleted: false,
            isBanned: false,
          },
      select: {
        id: true,
      },
    });
    if (!member) {
      throw new UnauthorizedException('Authenticated member not found.');
    }

    return member.id;
  }

  private async getAccessibleMemberships(memberId: string) {
    return this.prisma.roomMember.findMany({
      where: {
        memberId,
        deletedAt: null,
        room: {
          isDisabled: false,
          deletedAt: null,
          members: {
            some: {
              deletedAt: null,
              memberId: {
                not: memberId,
              },
              member: {
                isDeleted: false,
                isBanned: false,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        roomId: true,
        memberId: true,
        lastReadMessageId: true,
        createdAt: true,
        room: {
          select: {
            id: true,
            createdAt: true,
            members: {
              where: {
                deletedAt: null,
                memberId: {
                  not: memberId,
                },
                member: {
                  isDeleted: false,
                  isBanned: false,
                },
              },
              orderBy: [
                {
                  createdAt: 'asc',
                },
                {
                  id: 'asc',
                },
              ],
              take: 1,
              select: {
                memberId: true,
                member: {
                  select: {
                    displayName: true,
                    username: true,
                    profileImageUrl: true,
                  },
                },
              },
            },
            messages: {
              orderBy: [
                {
                  cursorSeq: 'desc',
                },
                {
                  createdAt: 'desc',
                },
                {
                  id: 'desc',
                },
              ],
              take: 1,
              select: {
                id: true,
                content: true,
                messageType: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
  }

  private async findAccessibleMembership(memberId: string, roomId: string) {
    return this.prisma.roomMember.findFirst({
      where: {
        roomId,
        memberId,
        deletedAt: null,
        room: {
          isDisabled: false,
          deletedAt: null,
          members: {
            some: {
              deletedAt: null,
              memberId: {
                not: memberId,
              },
              member: {
                isDeleted: false,
                isBanned: false,
              },
            },
          },
        },
      },
      select: {
        id: true,
        roomId: true,
        memberId: true,
        lastReadMessageId: true,
      },
    });
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
    if (memberships.length === 0) {
      return new Map();
    }

    const roomIds = [
      ...new Set(memberships.map((membership) => membership.roomId)),
    ];
    const cursorMessageIds = [
      ...new Set(
        memberships
          .map((membership) => membership.lastReadMessageId)
          .filter((messageId): messageId is string => Boolean(messageId)),
      ),
    ];

    const [cursorMessages, roomMessages]: [
      Array<{ id: string; roomId: string; cursorSeq: bigint }>,
      Array<{ roomId: string; cursorSeq: bigint }>,
    ] = await Promise.all([
      cursorMessageIds.length === 0
        ? Promise.resolve(
            [] as Array<{ id: string; roomId: string; cursorSeq: bigint }>,
          )
        : this.prisma.message.findMany({
            where: {
              id: {
                in: cursorMessageIds,
              },
            },
            select: {
              id: true,
              roomId: true,
              cursorSeq: true,
            },
          }),
      this.prisma.message.findMany({
        where: {
          roomId: {
            in: roomIds,
          },
        },
        select: {
          roomId: true,
          cursorSeq: true,
        },
      }),
    ]);

    const cursorByMessageId = new Map(
      cursorMessages.map((message) => [message.id, message]),
    );
    const thresholdByRoomId = new Map<string, bigint | null>();

    for (const membership of memberships) {
      const cursorMessage = membership.lastReadMessageId
        ? cursorByMessageId.get(membership.lastReadMessageId)
        : undefined;

      thresholdByRoomId.set(
        membership.roomId,
        cursorMessage && cursorMessage.roomId === membership.roomId
          ? cursorMessage.cursorSeq
          : null,
      );
    }

    const unreadCounts = new Map(roomIds.map((roomId) => [roomId, 0]));

    for (const message of roomMessages) {
      const threshold = thresholdByRoomId.get(message.roomId) ?? null;
      if (threshold === null || message.cursorSeq > threshold) {
        unreadCounts.set(
          message.roomId,
          (unreadCounts.get(message.roomId) ?? 0) + 1,
        );
      }
    }

    return unreadCounts;
  }
}

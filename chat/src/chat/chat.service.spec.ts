import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

const createPrismaMock = () => ({
  member: {
    findFirst: jest.fn(),
  },
  roomMember: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  message: {
    count: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
});

describe('ChatService', () => {
  let service: ChatService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const memberId = '11111111-1111-1111-1111-111111111111';
  const username = 'tester';
  const roomId = '22222222-2222-2222-2222-222222222222';
  const messageId = '33333333-3333-3333-3333-333333333333';

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ChatService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('resolves username subjects and maps room summaries', async () => {
    prisma.member.findFirst.mockResolvedValue({ id: memberId });
    prisma.roomMember.findMany.mockResolvedValueOnce([
      {
        id: 'membership-1',
        roomId: 'room-1',
        memberId,
        lastReadMessageId: 'message-4',
        createdAt: new Date('2026-03-29T23:00:00.000Z'),
        room: {
          id: 'room-1',
          createdAt: new Date('2026-03-29T00:00:00.000Z'),
          members: [
            {
              memberId: 'member-2',
              member: {
                displayName: 'Alex',
                username: 'alex',
                profileImageUrl: 'https://example.com/alex.png',
              },
            },
          ],
          messages: [
            {
              id: 'message-9',
              content: 'hello',
              messageType: 'TEXT',
              createdAt: new Date('2026-03-30T00:00:00.000Z'),
            },
          ],
        },
      },
    ]);
    prisma.message.findMany
      .mockResolvedValueOnce([
        {
          id: 'message-4',
          roomId: 'room-1',
          cursorSeq: 4n,
        },
      ])
      .mockResolvedValueOnce([
        {
          roomId: 'room-1',
          cursorSeq: 5n,
        },
        {
          roomId: 'room-1',
          cursorSeq: 6n,
        },
        {
          roomId: 'room-1',
          cursorSeq: 7n,
        },
      ]);

    const result = await service.getRooms(username);

    expect(prisma.member.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.roomMember.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.message.findMany).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      {
        id: 'room-1',
        counterpartId: 'member-2',
        counterpartName: 'Alex',
        counterpartProfileImageUrl: 'https://example.com/alex.png',
        lastReadMessageId: 'message-4',
        lastMessage: {
          id: 'message-9',
          content: 'hello',
          messageType: 'TEXT',
          createdAt: '2026-03-30T00:00:00.000Z',
        },
        unreadCount: 3,
      },
    ]);
  });

  it('maps empty last message to null', async () => {
    prisma.member.findFirst.mockResolvedValue({ id: memberId });
    prisma.roomMember.findMany.mockResolvedValueOnce([
      {
        id: 'membership-2',
        roomId: 'room-2',
        memberId,
        lastReadMessageId: null,
        createdAt: new Date('2026-03-29T23:00:00.000Z'),
        room: {
          id: 'room-2',
          createdAt: new Date('2026-03-29T00:00:00.000Z'),
          members: [
            {
              memberId: 'member-3',
              member: {
                displayName: 'Jamie',
                username: 'jamie',
                profileImageUrl: null,
              },
            },
          ],
          messages: [],
        },
      },
    ]);
    prisma.message.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        roomId: 'room-2',
        cursorSeq: 1n,
      },
    ]);

    const result = await service.getRooms('another-user');

    expect(result).toEqual([
      {
        id: 'room-2',
        counterpartId: 'member-3',
        counterpartName: 'Jamie',
        counterpartProfileImageUrl: null,
        lastReadMessageId: null,
        lastMessage: null,
        unreadCount: 0,
      },
    ]);
  });

  it('returns an empty room list when no accessible room exists', async () => {
    prisma.member.findFirst.mockResolvedValue({ id: memberId });
    prisma.roomMember.findMany.mockResolvedValue([]);

    await expect(service.getRooms(username)).resolves.toEqual([]);
    expect(prisma.message.findMany).not.toHaveBeenCalled();
  });

  it('marks the room as read up to the latest message', async () => {
    prisma.member.findFirst.mockResolvedValue({ id: memberId });
    prisma.roomMember.findFirst.mockResolvedValue({
      id: 'member-row-id',
      roomId,
      memberId,
      lastReadMessageId: null,
    });
    prisma.message.findFirst.mockResolvedValue({
      id: messageId,
      roomId,
      senderId: memberId,
      messageType: 'TEXT',
      content: 'hello',
      createdAt: new Date('2026-03-30T10:00:00.000Z'),
      cursorSeq: 11n,
    });
    prisma.roomMember.update.mockResolvedValue({ id: 'member-row-id' });

    await expect(service.markRoomAsRead(username, roomId)).resolves.toEqual({
      roomId,
      lastReadMessageId: messageId,
      unreadCount: 0,
    });

    expect(prisma.roomMember.update).toHaveBeenCalledWith({
      where: {
        id: 'member-row-id',
      },
      data: {
        lastReadMessageId: messageId,
      },
    });
  });

  it('throws 404 when the room is not accessible', async () => {
    prisma.member.findFirst.mockResolvedValue({ id: memberId });
    prisma.roomMember.findFirst.mockResolvedValue(null);

    await expect(
      service.markRoomAsRead(username, roomId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.roomMember.findFirst).toHaveBeenCalled();
  });

  it('throws 404 when the room membership is missing', async () => {
    prisma.roomMember.findFirst.mockResolvedValue(null);
    prisma.member.findFirst.mockResolvedValue({ id: memberId });

    await expect(
      service.markRoomAsRead(username, roomId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.roomMember.findFirst).toHaveBeenCalled();
  });

  it('counts only messages after the last read cursor', async () => {
    prisma.member.findFirst.mockResolvedValue({ id: memberId });
    prisma.roomMember.findMany.mockResolvedValue([
      {
        id: 'member-row-id',
        roomId,
        memberId,
        lastReadMessageId: messageId,
        createdAt: new Date('2026-03-30T09:00:00.000Z'),
        room: {
          id: roomId,
          createdAt: new Date('2026-03-30T08:00:00.000Z'),
          members: [
            {
              memberId: 'member-2',
              member: {
                displayName: 'Alex',
                username: 'alex',
                profileImageUrl: null,
              },
            },
          ],
          messages: [],
        },
      },
    ]);
    prisma.message.findMany
      .mockResolvedValueOnce([
        {
          id: messageId,
          roomId,
          cursorSeq: 10n,
        },
      ])
      .mockResolvedValueOnce([
        {
          roomId,
          cursorSeq: 11n,
        },
        {
          roomId,
          cursorSeq: 12n,
        },
      ]);

    await expect(service.getUnreadSummary(username)).resolves.toEqual({
      totalUnread: 2,
      rooms: [
        {
          roomId,
          unreadCount: 2,
        },
      ],
    });
  });

  it('returns an empty unread summary when no accessible room exists', async () => {
    prisma.member.findFirst.mockResolvedValue({ id: memberId });
    prisma.roomMember.findMany.mockResolvedValue([]);

    await expect(service.getUnreadSummary(username)).resolves.toEqual({
      totalUnread: 0,
      rooms: [],
    });

    expect(prisma.message.findMany).not.toHaveBeenCalled();
  });

  it('falls back to counting the full room when the cursor points to another room', async () => {
    prisma.member.findFirst.mockResolvedValue({ id: memberId });
    prisma.roomMember.findMany.mockResolvedValue([
      {
        id: 'member-row-id',
        roomId,
        memberId,
        lastReadMessageId: messageId,
        createdAt: new Date('2026-03-30T09:00:00.000Z'),
        room: {
          id: roomId,
          createdAt: new Date('2026-03-30T08:00:00.000Z'),
          members: [
            {
              memberId: 'member-2',
              member: {
                displayName: 'Alex',
                username: 'alex',
                profileImageUrl: null,
              },
            },
          ],
          messages: [],
        },
      },
    ]);
    prisma.message.findMany
      .mockResolvedValueOnce([
        {
          id: messageId,
          roomId: 'another-room',
          cursorSeq: 10n,
        },
      ])
      .mockResolvedValueOnce([
        {
          roomId,
          cursorSeq: 1n,
        },
        {
          roomId,
          cursorSeq: 2n,
        },
        {
          roomId,
          cursorSeq: 3n,
        },
        {
          roomId,
          cursorSeq: 4n,
        },
      ]);

    await expect(service.getUnreadSummary(username)).resolves.toEqual({
      totalUnread: 4,
      rooms: [
        {
          roomId,
          unreadCount: 4,
        },
      ],
    });
  });

  it('rejects UUID subjects that do not resolve to an active member', async () => {
    prisma.member.findFirst.mockResolvedValue(null);

    await expect(service.getRooms(memberId)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(prisma.roomMember.findMany).not.toHaveBeenCalled();
  });
});

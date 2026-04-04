import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

const createPrismaMock = () => ({
  $queryRaw: jest.fn(),
  chatRoom: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  roomMember: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  message: {
    count: jest.fn(),
    findFirst: jest.fn(),
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
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: memberId }])
      .mockResolvedValueOnce([{ room_id: 'room-1' }])
      .mockResolvedValueOnce([
        {
          id: 'room-1',
          counterpart_id: 'member-2',
          counterpart_name: 'Alex',
          counterpart_profile_image_url: 'https://example.com/alex.png',
          last_message_id: 'message-9',
          last_message_content: 'hello',
          last_message_type: 'TEXT',
          last_message_created_at: new Date('2026-03-30T00:00:00.000Z'),
          unread_count: 3,
        },
      ]);

    const result = await service.getRooms(username);
    const roomQueryCall = prisma.$queryRaw.mock.calls[2] as [
      { values: readonly unknown[] },
    ];

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(3);
    expect(roomQueryCall[0].values).toEqual(expect.arrayContaining([memberId]));
    expect(result).toEqual([
      {
        id: 'room-1',
        counterpartId: 'member-2',
        counterpartName: 'Alex',
        counterpartProfileImageUrl: 'https://example.com/alex.png',
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
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: memberId }])
      .mockResolvedValueOnce([{ room_id: 'room-2' }])
      .mockResolvedValueOnce([
        {
          id: 'room-2',
          counterpart_id: 'member-3',
          counterpart_name: 'Jamie',
          counterpart_profile_image_url: null,
          last_message_id: null,
          last_message_content: null,
          last_message_type: null,
          last_message_created_at: null,
          unread_count: 0,
        },
      ]);

    const result = await service.getRooms('another-user');

    expect(result).toEqual([
      {
        id: 'room-2',
        counterpartId: 'member-3',
        counterpartName: 'Jamie',
        counterpartProfileImageUrl: null,
        lastMessage: null,
        unreadCount: 0,
      },
    ]);
  });

  it('returns an empty room list when no accessible room exists', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: memberId }])
      .mockResolvedValueOnce([]);

    await expect(service.getRooms(username)).resolves.toEqual([]);
  });

  it('marks the room as read up to the latest message', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: memberId }])
      .mockResolvedValueOnce([{ room_id: roomId }]);
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
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: memberId }])
      .mockResolvedValueOnce([]);

    await expect(
      service.markRoomAsRead(username, roomId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.roomMember.findFirst).not.toHaveBeenCalled();
  });

  it('throws 404 when the room membership is missing', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: memberId }])
      .mockResolvedValueOnce([{ room_id: roomId }]);
    prisma.roomMember.findFirst.mockResolvedValue(null);

    await expect(
      service.markRoomAsRead(username, roomId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.roomMember.findFirst).toHaveBeenCalled();
  });

  it('counts only messages after the last read cursor', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: memberId }])
      .mockResolvedValueOnce([{ room_id: roomId }])
      .mockResolvedValueOnce([{ room_id: roomId, unread_count: 2 }]);
    prisma.roomMember.findMany.mockResolvedValue([
      {
        id: 'member-row-id',
        roomId,
        memberId,
        lastReadMessageId: messageId,
        createdAt: new Date('2026-03-30T09:00:00.000Z'),
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
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: memberId }])
      .mockResolvedValueOnce([]);

    await expect(service.getUnreadSummary(username)).resolves.toEqual({
      totalUnread: 0,
      rooms: [],
    });

    expect(prisma.roomMember.findMany).not.toHaveBeenCalled();
  });

  it('falls back to counting the full room when the cursor points to another room', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([{ id: memberId }])
      .mockResolvedValueOnce([{ room_id: roomId }])
      .mockResolvedValueOnce([{ room_id: roomId, unread_count: 4 }]);
    prisma.roomMember.findMany.mockResolvedValue([
      {
        id: 'member-row-id',
        roomId,
        memberId,
        lastReadMessageId: messageId,
        createdAt: new Date('2026-03-30T09:00:00.000Z'),
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
});

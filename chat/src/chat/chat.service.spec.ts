import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChatRoomStatus,
  ChatRoomType,
  MessageType,
} from './dto/chat-response.dto';
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: PrismaService,
          useValue: createPrismaMock(),
        },
      ],
    }).compile();

    service = module.get(ChatService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('marks the room as read up to the latest message', async () => {
    prisma.chatRoom.findFirst.mockResolvedValue({
      id: roomId,
      type: 'ONE_TO_ONE' satisfies ChatRoomType,
      status: 'ACTIVE' satisfies ChatRoomStatus,
      externalRefType: 'RESERVATION',
      externalRefId: null,
    });
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
      messageType: 'TEXT' satisfies MessageType,
      content: 'hello',
      createdAt: new Date('2026-03-30T10:00:00.000Z'),
      cursorSeq: 11n,
    });
    prisma.roomMember.update.mockResolvedValue({ id: 'member-row-id' });

    await expect(service.markRoomAsRead(memberId, roomId)).resolves.toEqual({
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
    prisma.chatRoom.findFirst.mockResolvedValue({
      id: roomId,
      type: 'ONE_TO_ONE' satisfies ChatRoomType,
      status: 'ACTIVE' satisfies ChatRoomStatus,
      externalRefType: 'RESERVATION',
      externalRefId: null,
    });
    prisma.roomMember.findFirst.mockResolvedValue(null);

    await expect(
      service.markRoomAsRead(memberId, roomId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns room list with last message and unread count', async () => {
    prisma.roomMember.findMany.mockResolvedValue([
      {
        id: 'member-row-id',
        roomId,
        memberId,
        lastReadMessageId: null,
        createdAt: new Date('2026-03-30T09:00:00.000Z'),
      },
    ]);
    prisma.chatRoom.findMany.mockResolvedValue([
      {
        id: roomId,
        type: 'ONE_TO_ONE' satisfies ChatRoomType,
        status: 'ACTIVE' satisfies ChatRoomStatus,
        externalRefType: 'RESERVATION',
        externalRefId: '44444444-4444-4444-4444-444444444444',
        updatedAt: new Date('2026-03-30T09:30:00.000Z'),
      },
    ]);
    prisma.message.findFirst.mockResolvedValue({
      id: messageId,
      roomId,
      senderId: '55555555-5555-5555-5555-555555555555',
      messageType: 'TEXT' satisfies MessageType,
      content: 'latest',
      createdAt: new Date('2026-03-30T10:00:00.000Z'),
      cursorSeq: 21n,
    });
    prisma.message.count.mockResolvedValue(3);

    await expect(service.listRooms(memberId)).resolves.toEqual([
      {
        roomId,
        type: 'ONE_TO_ONE',
        status: 'ACTIVE',
        externalRefType: 'RESERVATION',
        externalRefId: '44444444-4444-4444-4444-444444444444',
        lastReadMessageId: null,
        unreadCount: 3,
        lastMessage: {
          id: messageId,
          senderId: '55555555-5555-5555-5555-555555555555',
          messageType: 'TEXT',
          content: 'latest',
          createdAt: '2026-03-30T10:00:00.000Z',
        },
      },
    ]);
  });

  it('counts only messages after the last read cursor', async () => {
    prisma.roomMember.findMany.mockResolvedValue([
      {
        id: 'member-row-id',
        roomId,
        memberId,
        lastReadMessageId: messageId,
        createdAt: new Date('2026-03-30T09:00:00.000Z'),
      },
    ]);
    prisma.chatRoom.findMany.mockResolvedValue([
      {
        id: roomId,
        type: 'ONE_TO_ONE' satisfies ChatRoomType,
        status: 'ACTIVE' satisfies ChatRoomStatus,
        externalRefType: 'RESERVATION',
        externalRefId: null,
        updatedAt: new Date('2026-03-30T09:30:00.000Z'),
      },
    ]);
    prisma.message.findUnique.mockResolvedValue({
      id: messageId,
      roomId,
      senderId: memberId,
      messageType: 'TEXT' satisfies MessageType,
      content: 'old',
      createdAt: new Date('2026-03-30T09:45:00.000Z'),
      cursorSeq: 42n,
    });
    prisma.message.count.mockResolvedValue(2);

    await expect(service.getUnreadSummary(memberId)).resolves.toEqual({
      totalUnread: 2,
      rooms: [
        {
          roomId,
          unreadCount: 2,
        },
      ],
    });
  });

  it('resolves username subjects to member UUIDs before querying rooms', async () => {
    prisma.$queryRaw.mockResolvedValue([{ id: memberId }]);
    prisma.roomMember.findMany.mockResolvedValue([
      {
        id: 'member-row-id',
        roomId,
        memberId,
        lastReadMessageId: null,
        createdAt: new Date('2026-03-30T09:00:00.000Z'),
      },
    ]);
    prisma.chatRoom.findMany.mockResolvedValue([
      {
        id: roomId,
        type: 'ONE_TO_ONE' satisfies ChatRoomType,
        status: 'ACTIVE' satisfies ChatRoomStatus,
        externalRefType: null,
        externalRefId: null,
        updatedAt: new Date('2026-03-30T09:30:00.000Z'),
      },
    ]);
    prisma.message.findFirst.mockResolvedValue({
      id: messageId,
      roomId,
      senderId: memberId,
      messageType: 'TEXT' satisfies MessageType,
      content: 'latest',
      createdAt: new Date('2026-03-30T10:00:00.000Z'),
      cursorSeq: 51n,
    });
    prisma.message.count.mockResolvedValue(1);

    await expect(service.listRooms(username)).resolves.toEqual([
      {
        roomId,
        type: 'ONE_TO_ONE',
        status: 'ACTIVE',
        externalRefType: null,
        externalRefId: null,
        lastReadMessageId: null,
        unreadCount: 1,
        lastMessage: {
          id: messageId,
          senderId: memberId,
          messageType: 'TEXT',
          content: 'latest',
          createdAt: '2026-03-30T10:00:00.000Z',
        },
      },
    ]);

    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('falls back to counting the full room when the cursor points to another room', async () => {
    prisma.roomMember.findMany.mockResolvedValue([
      {
        id: 'member-row-id',
        roomId,
        memberId,
        lastReadMessageId: messageId,
        createdAt: new Date('2026-03-30T09:00:00.000Z'),
      },
    ]);
    prisma.chatRoom.findMany.mockResolvedValue([
      {
        id: roomId,
        type: 'ONE_TO_ONE' satisfies ChatRoomType,
        status: 'ACTIVE' satisfies ChatRoomStatus,
        externalRefType: 'RESERVATION',
        externalRefId: null,
        updatedAt: new Date('2026-03-30T09:30:00.000Z'),
      },
    ]);
    prisma.message.findUnique.mockResolvedValue({
      id: messageId,
      roomId: '99999999-9999-9999-9999-999999999999',
      senderId: memberId,
      messageType: 'TEXT' satisfies MessageType,
      content: 'foreign-room-message',
      createdAt: new Date('2026-03-30T09:45:00.000Z'),
      cursorSeq: 99n,
    });
    prisma.message.count.mockResolvedValue(4);

    await expect(service.getUnreadSummary(memberId)).resolves.toEqual({
      totalUnread: 4,
      rooms: [
        {
          roomId,
          unreadCount: 4,
        },
      ],
    });
  });

  it('counts unread messages by cursor sequence instead of timestamp ties', async () => {
    prisma.message.findUnique.mockResolvedValue({
      id: messageId,
      roomId,
      senderId: memberId,
      messageType: 'TEXT' satisfies MessageType,
      content: 'old',
      createdAt: new Date('2026-03-30T09:45:00.000Z'),
      cursorSeq: 77n,
    });
    prisma.message.count.mockResolvedValue(2);

    await service['getUnreadCount'](roomId, messageId);

    expect(prisma.message.count).toHaveBeenCalledWith({
      where: {
        roomId,
        cursorSeq: {
          gt: 77n,
        },
      },
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { ChatRoomStatus, ChatRoomType, MessageType } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

const createPrismaMock = () => ({
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

  it('채팅방 진입 시 마지막 메시지까지 읽음 처리한다', async () => {
    prisma.chatRoom.findFirst.mockResolvedValue({
      id: roomId,
      type: ChatRoomType.ONE_TO_ONE,
      status: ChatRoomStatus.ACTIVE,
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
      messageType: MessageType.TEXT,
      content: 'hello',
      createdAt: new Date('2026-03-30T10:00:00.000Z'),
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

  it('접근할 수 없는 채팅방이면 404를 던진다', async () => {
    prisma.chatRoom.findFirst.mockResolvedValue({
      id: roomId,
      type: ChatRoomType.ONE_TO_ONE,
      status: ChatRoomStatus.ACTIVE,
      externalRefType: 'RESERVATION',
      externalRefId: null,
    });
    prisma.roomMember.findFirst.mockResolvedValue(null);

    await expect(
      service.markRoomAsRead(memberId, roomId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('방 목록 조회 시 마지막 메시지와 unread count를 함께 반환한다', async () => {
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
        type: ChatRoomType.ONE_TO_ONE,
        status: ChatRoomStatus.ACTIVE,
        externalRefType: 'RESERVATION',
        externalRefId: '44444444-4444-4444-4444-444444444444',
        updatedAt: new Date('2026-03-30T09:30:00.000Z'),
      },
    ]);
    prisma.message.findFirst.mockResolvedValue({
      id: messageId,
      roomId,
      senderId: '55555555-5555-5555-5555-555555555555',
      messageType: MessageType.TEXT,
      content: 'latest',
      createdAt: new Date('2026-03-30T10:00:00.000Z'),
    });
    prisma.message.count.mockResolvedValue(3);

    await expect(service.listRooms(memberId)).resolves.toEqual([
      {
        roomId,
        type: ChatRoomType.ONE_TO_ONE,
        status: ChatRoomStatus.ACTIVE,
        externalRefType: 'RESERVATION',
        externalRefId: '44444444-4444-4444-4444-444444444444',
        lastReadMessageId: null,
        unreadCount: 3,
        lastMessage: {
          id: messageId,
          senderId: '55555555-5555-5555-5555-555555555555',
          messageType: MessageType.TEXT,
          content: 'latest',
          createdAt: '2026-03-30T10:00:00.000Z',
        },
      },
    ]);
  });

  it('읽은 커서가 있으면 커서 이후 메시지만 unread로 계산한다', async () => {
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
        type: ChatRoomType.ONE_TO_ONE,
        status: ChatRoomStatus.ACTIVE,
        externalRefType: 'RESERVATION',
        externalRefId: null,
        updatedAt: new Date('2026-03-30T09:30:00.000Z'),
      },
    ]);
    prisma.message.findUnique.mockResolvedValue({
      id: messageId,
      roomId,
      senderId: memberId,
      messageType: MessageType.TEXT,
      content: 'old',
      createdAt: new Date('2026-03-30T09:45:00.000Z'),
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

  it('다른 방 메시지를 lastRead cursor로 받으면 해당 방 전체 메시지를 unread로 계산한다', async () => {
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
        type: ChatRoomType.ONE_TO_ONE,
        status: ChatRoomStatus.ACTIVE,
        externalRefType: 'RESERVATION',
        externalRefId: null,
        updatedAt: new Date('2026-03-30T09:30:00.000Z'),
      },
    ]);
    prisma.message.findUnique.mockResolvedValue({
      id: messageId,
      roomId: '99999999-9999-9999-9999-999999999999',
      senderId: memberId,
      messageType: MessageType.TEXT,
      content: 'foreign-room-message',
      createdAt: new Date('2026-03-30T09:45:00.000Z'),
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
});

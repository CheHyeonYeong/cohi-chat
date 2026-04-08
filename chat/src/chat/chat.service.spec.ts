import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { encodeMessageCursor, MessageCursor } from './message-cursor';
import type { PrismaService } from '../prisma/prisma.service';
import { ChatRoomActivityNotifier } from './chat-room-activity-notifier';
import { ChatService } from './chat.service';

type MessageQueryRow = {
  id: string;
  roomId: string;
  senderId: string | null;
  messageType: string;
  content: string | null;
  payload: unknown;
  createdAt: Date;
};

const ROOM_ID = '11111111-1111-1111-1111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const ROOM_MEMBER_ID = '33333333-3333-4333-8333-333333333333';
const FIRST_MESSAGE_ID = '44444444-4444-4444-8444-444444444444';
const SECOND_MESSAGE_ID = '55555555-5555-4555-8555-555555555555';
const THIRD_MESSAGE_ID = '66666666-6666-4666-8666-666666666666';

const createMessageRow = (
  id: string,
  createdAt: string,
  content: string,
): MessageQueryRow => ({
  id,
  roomId: ROOM_ID,
  senderId: MEMBER_ID,
  messageType: 'TEXT',
  content,
  payload: null,
  createdAt: new Date(createdAt),
});

describe('ChatService', () => {
  let service: ChatService;
  let memberFindFirstMock: jest.Mock;
  let roomMemberFindFirstMock: jest.Mock;
  let rootMessageCreateMock: jest.Mock;
  let rootMessageFindManyMock: jest.Mock;
  let transactionMock: jest.Mock;
  let txMemberFindFirstMock: jest.Mock;
  let txRoomMemberFindFirstMock: jest.Mock;
  let txRoomMemberUpdateMock: jest.Mock;
  let txMessageCreateMock: jest.Mock;
  let txMessageFindManyMock: jest.Mock;
  let notifyRoomActivityMock: jest.Mock;
  let lifecycleEvents: string[];

  beforeEach(() => {
    memberFindFirstMock = jest.fn().mockResolvedValue({ id: MEMBER_ID });
    roomMemberFindFirstMock = jest.fn().mockResolvedValue({ id: ROOM_MEMBER_ID });
    rootMessageCreateMock = jest.fn();
    rootMessageFindManyMock = jest.fn();
    txMemberFindFirstMock = jest.fn().mockResolvedValue({ id: MEMBER_ID });
    txRoomMemberFindFirstMock = jest.fn().mockResolvedValue({ id: ROOM_MEMBER_ID });
    txRoomMemberUpdateMock = jest.fn().mockResolvedValue({});
    txMessageFindManyMock = jest.fn();
    txMessageCreateMock = jest.fn(
      ({
        data,
      }: {
        data: {
          roomId: string;
          senderId: string;
          messageType: string;
          content: string;
        };
      }) =>
        Promise.resolve({
          id: FIRST_MESSAGE_ID,
          roomId: data.roomId,
          senderId: data.senderId,
          messageType: data.messageType,
          content: data.content,
          payload: null,
          createdAt: new Date('2026-03-31T00:00:00.000Z'),
        }),
    );
    lifecycleEvents = [];
    notifyRoomActivityMock = jest.fn(async () => {
      lifecycleEvents.push('notify');
    });
    transactionMock = jest.fn(
      async (
        callback: (tx: unknown) => Promise<unknown>,
        _options?: unknown,
      ) => {
        const result = await callback({
          member: {
            findFirst: txMemberFindFirstMock,
          },
          roomMember: {
            findFirst: txRoomMemberFindFirstMock,
            update: txRoomMemberUpdateMock,
          },
          message: {
            create: txMessageCreateMock,
            findMany: txMessageFindManyMock,
          },
        });
        lifecycleEvents.push('commit');
        return result;
      },
    );

    service = new ChatService(
      {
        member: { findFirst: memberFindFirstMock },
        roomMember: { findFirst: roomMemberFindFirstMock, update: jest.fn() },
        message: {
          create: rootMessageCreateMock,
          findMany: rootMessageFindManyMock,
        },
        $transaction: transactionMock,
      } as unknown as PrismaService,
      {
        notifyRoomActivity: notifyRoomActivityMock,
      } as unknown as ChatRoomActivityNotifier,
    );
  });

  it('stores trimmed content, advances sender read cursor, and notifies after commit', async () => {
    const result = await service.sendMessage(ROOM_ID, 'tester', {
      content: '  hello world  ',
    });

    expect(transactionMock).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(txMemberFindFirstMock).toHaveBeenCalledWith({
      where: {
        username: 'tester',
        isDeleted: false,
        isBanned: false,
      },
      select: { id: true },
    });
    expect(txRoomMemberFindFirstMock).toHaveBeenCalledWith({
      where: {
        roomId: ROOM_ID,
        memberId: MEMBER_ID,
        deletedAt: null,
        room: {
          isDisabled: false,
        },
      },
      select: { id: true },
    });
    expect(txMessageCreateMock).toHaveBeenCalledWith({
      data: {
        roomId: ROOM_ID,
        senderId: MEMBER_ID,
        messageType: 'TEXT',
        content: 'hello world',
      },
    });
    expect(txRoomMemberUpdateMock).toHaveBeenCalledWith({
      where: { id: ROOM_MEMBER_ID },
      data: { lastReadMessageId: FIRST_MESSAGE_ID },
    });
    expect(notifyRoomActivityMock).toHaveBeenCalledWith(ROOM_ID);
    expect(lifecycleEvents).toEqual(['commit', 'notify']);
    expect(rootMessageCreateMock).not.toHaveBeenCalled();
    expect(memberFindFirstMock).not.toHaveBeenCalled();
    expect(roomMemberFindFirstMock).not.toHaveBeenCalled();
    expect(result.content).toBe('hello world');
  });

  it('continues successfully when notify fails after commit', async () => {
    notifyRoomActivityMock.mockImplementationOnce(async () => {
      lifecycleEvents.push('notify');
      throw new Error('waiter registry down');
    });

    await expect(
      service.sendMessage(ROOM_ID, 'tester', { content: 'hello world' }),
    ).resolves.toMatchObject({
      id: FIRST_MESSAGE_ID,
      roomId: ROOM_ID,
      senderId: MEMBER_ID,
      messageType: 'TEXT',
      content: 'hello world',
    });
    expect(notifyRoomActivityMock).toHaveBeenCalledWith(ROOM_ID);
    expect(lifecycleEvents).toEqual(['commit', 'notify']);
  });

  it('validates max length after trimming', async () => {
    const content = `  ${'a'.repeat(1000)}  `;

    const result = await service.sendMessage(ROOM_ID, 'tester', { content });

    expect(result.content).toBe('a'.repeat(1000));
    expect(txMessageCreateMock).toHaveBeenCalledWith({
      data: {
        roomId: ROOM_ID,
        senderId: MEMBER_ID,
        messageType: 'TEXT',
        content: 'a'.repeat(1000),
      },
    });
    expect(notifyRoomActivityMock).toHaveBeenCalledWith(ROOM_ID);
  });

  it('rejects empty trimmed content', async () => {
    await expect(
      service.sendMessage(ROOM_ID, 'tester', {
        content: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transactionMock).not.toHaveBeenCalled();
    expect(notifyRoomActivityMock).not.toHaveBeenCalled();
  });

  it('rejects messaging when the room membership is inactive', async () => {
    txRoomMemberFindFirstMock.mockResolvedValueOnce(null);

    await expect(
      service.sendMessage(ROOM_ID, 'tester', { content: 'hello' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(txMessageCreateMock).not.toHaveBeenCalled();
    expect(txRoomMemberUpdateMock).not.toHaveBeenCalled();
    expect(notifyRoomActivityMock).not.toHaveBeenCalled();
  });

  it('rejects messaging when the authenticated member is inactive', async () => {
    txMemberFindFirstMock.mockResolvedValueOnce(null);

    await expect(
      service.sendMessage(ROOM_ID, 'tester', { content: 'hello' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(txRoomMemberFindFirstMock).not.toHaveBeenCalled();
    expect(txMessageCreateMock).not.toHaveBeenCalled();
    expect(notifyRoomActivityMock).not.toHaveBeenCalled();
  });

  it('builds nextCursor from the last visible message timestamp and id', async () => {
    txMessageFindManyMock.mockResolvedValueOnce([
      createMessageRow(THIRD_MESSAGE_ID, '2026-03-31T00:00:00.124Z', 'third'),
      createMessageRow(SECOND_MESSAGE_ID, '2026-03-31T00:00:00.123Z', 'second'),
      createMessageRow(FIRST_MESSAGE_ID, '2026-03-31T00:00:00.123Z', 'first'),
    ]);

    const result = await service.getMessages(ROOM_ID, 'tester', undefined, 2);

    expect(transactionMock).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(txMemberFindFirstMock).toHaveBeenCalledWith({
      where: {
        username: 'tester',
        isDeleted: false,
        isBanned: false,
      },
      select: { id: true },
    });
    expect(txRoomMemberFindFirstMock).toHaveBeenCalledWith({
      where: {
        roomId: ROOM_ID,
        memberId: MEMBER_ID,
        deletedAt: null,
        room: {
          isDisabled: false,
        },
      },
      select: { id: true },
    });
    expect(txMessageFindManyMock).toHaveBeenCalledWith({
      where: {
        roomId: ROOM_ID,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 3,
      select: {
        id: true,
        roomId: true,
        senderId: true,
        messageType: true,
        content: true,
        payload: true,
        createdAt: true,
      },
    });
    expect(result.messages.map((message) => message.id)).toEqual([
      THIRD_MESSAGE_ID,
      SECOND_MESSAGE_ID,
    ]);
    expect(result.nextCursor).toBe(
      encodeMessageCursor({
        createdAt: '2026-03-31T00:00:00.123Z',
        id: SECOND_MESSAGE_ID,
      }),
    );
    expect(memberFindFirstMock).not.toHaveBeenCalled();
    expect(roomMemberFindFirstMock).not.toHaveBeenCalled();
    expect(rootMessageFindManyMock).not.toHaveBeenCalled();
  });

  it('uses Prisma cursor pagination with stable createdAt and id ordering', async () => {
    const cursor: MessageCursor = {
      createdAt: '2026-03-31T00:00:00.123Z',
      id: SECOND_MESSAGE_ID,
    };
    txMessageFindManyMock.mockResolvedValueOnce([
      createMessageRow(FIRST_MESSAGE_ID, '2026-03-31T00:00:00.123Z', 'first'),
    ]);

    const result = await service.getMessages(ROOM_ID, 'tester', cursor, 2);

    expect(txMessageFindManyMock).toHaveBeenCalledWith({
      where: {
        roomId: ROOM_ID,
      },
      cursor: {
        id: cursor.id,
      },
      skip: 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 3,
      select: {
        id: true,
        roomId: true,
        senderId: true,
        messageType: true,
        content: true,
        payload: true,
        createdAt: true,
      },
    });
    expect(result.messages.map((message) => message.id)).toEqual([
      FIRST_MESSAGE_ID,
    ]);
    expect(result.nextCursor).toBeNull();
  });

  it('rejects message lookup when the authenticated member is inactive', async () => {
    txMemberFindFirstMock.mockResolvedValueOnce(null);

    await expect(
      service.getMessages(ROOM_ID, 'tester', undefined, 2),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(txRoomMemberFindFirstMock).not.toHaveBeenCalled();
    expect(txMessageFindManyMock).not.toHaveBeenCalled();
  });
});

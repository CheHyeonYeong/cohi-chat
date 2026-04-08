import { Prisma } from '@prisma/client';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { encodeMessageCursor, MessageCursor } from './message-cursor';
import type { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

type MessageQueryRow = {
  id: string;
  roomId: string;
  senderId: string | null;
  messageType: string;
  content: string | null;
  payload: unknown;
  createdAt: Date;
  cursorCreatedAt: string;
};

const ROOM_ID = '11111111-1111-1111-1111-111111111111';
const MEMBER_ID = '22222222-2222-4222-8222-222222222222';
const ROOM_MEMBER_ID = '33333333-3333-4333-8333-333333333333';
const FIRST_MESSAGE_ID = '44444444-4444-4444-8444-444444444444';
const SECOND_MESSAGE_ID = '55555555-5555-4555-8555-555555555555';
const THIRD_MESSAGE_ID = '66666666-6666-4666-8666-666666666666';

const createMessageRow = (
  id: string,
  cursorCreatedAt: string,
  content: string,
): MessageQueryRow => ({
  id,
  roomId: ROOM_ID,
  senderId: MEMBER_ID,
  messageType: 'TEXT',
  content,
  payload: null,
  createdAt: new Date('2026-03-31T00:00:00.123Z'),
  cursorCreatedAt,
});

describe('ChatService', () => {
  let service: ChatService;
  let queryRawMock: jest.Mock;
  let memberFindFirstMock: jest.Mock;
  let roomMemberFindFirstMock: jest.Mock;
  let rootMessageCreateMock: jest.Mock;
  let transactionMock: jest.Mock;
  let txRoomMemberFindFirstMock: jest.Mock;
  let txRoomMemberUpdateMock: jest.Mock;
  let txMessageCreateMock: jest.Mock;

  beforeEach(() => {
    queryRawMock = jest.fn();
    memberFindFirstMock = jest.fn().mockResolvedValue({ id: MEMBER_ID });
    roomMemberFindFirstMock = jest.fn().mockResolvedValue({ id: ROOM_MEMBER_ID });
    rootMessageCreateMock = jest.fn();
    txRoomMemberFindFirstMock = jest.fn().mockResolvedValue({ id: ROOM_MEMBER_ID });
    txRoomMemberUpdateMock = jest.fn().mockResolvedValue({});
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
    transactionMock = jest.fn(async (callback: (tx: unknown) => Promise<unknown>, options?: unknown) =>
      callback({
        roomMember: {
          findFirst: txRoomMemberFindFirstMock,
          update: txRoomMemberUpdateMock,
        },
        message: {
          create: txMessageCreateMock,
        },
      }),
    );

    service = new ChatService({
      $queryRaw: queryRawMock,
      member: { findFirst: memberFindFirstMock },
      roomMember: { findFirst: roomMemberFindFirstMock, update: jest.fn() },
      message: { create: rootMessageCreateMock, findMany: jest.fn() },
      $transaction: transactionMock,
    } as unknown as PrismaService);
  });

  it('stores trimmed content and advances sender read cursor in one transaction', async () => {
    const result = await service.sendMessage(ROOM_ID, 'tester', {
      content: '  hello world  ',
    });

    expect(transactionMock).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
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
    expect(rootMessageCreateMock).not.toHaveBeenCalled();
    expect(roomMemberFindFirstMock).not.toHaveBeenCalled();
    expect(result.content).toBe('hello world');
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
  });

  it('rejects empty trimmed content', async () => {
    await expect(
      service.sendMessage(ROOM_ID, 'tester', {
        content: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('rejects messaging when the room membership is inactive', async () => {
    txRoomMemberFindFirstMock.mockResolvedValueOnce(null);

    await expect(
      service.sendMessage(ROOM_ID, 'tester', { content: 'hello' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(txMessageCreateMock).not.toHaveBeenCalled();
    expect(txRoomMemberUpdateMock).not.toHaveBeenCalled();
  });

  it('builds nextCursor from the exact DB timestamp and message id', async () => {
    queryRawMock.mockResolvedValueOnce([
      createMessageRow(THIRD_MESSAGE_ID, '2026-03-31T00:00:00.123456Z', 'third'),
      createMessageRow(SECOND_MESSAGE_ID, '2026-03-31T00:00:00.123001Z', 'second'),
      createMessageRow(FIRST_MESSAGE_ID, '2026-03-31T00:00:00.122999Z', 'first'),
    ]);

    const result = await service.getMessages(ROOM_ID, 'tester', undefined, 2);

    expect(roomMemberFindFirstMock).toHaveBeenCalledWith({
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
    expect(result.messages.map((message) => message.id)).toEqual([
      THIRD_MESSAGE_ID,
      SECOND_MESSAGE_ID,
    ]);
    expect(result.nextCursor).toBe(
      encodeMessageCursor({
        createdAt: '2026-03-31T00:00:00.123001Z',
        id: SECOND_MESSAGE_ID,
      }),
    );
  });

  it('uses the composite cursor in the next page query', async () => {
    const cursor: MessageCursor = {
      createdAt: '2026-03-31T00:00:00.123001Z',
      id: SECOND_MESSAGE_ID,
    };
    queryRawMock.mockResolvedValueOnce([
      createMessageRow(FIRST_MESSAGE_ID, '2026-03-31T00:00:00.122999Z', 'first'),
    ]);

    const result = await service.getMessages(ROOM_ID, 'tester', cursor, 2);

    expect(queryRawMock).toHaveBeenCalledWith(
      expect.objectContaining({
        values: [ROOM_ID, cursor.createdAt, cursor.createdAt, cursor.id, 3],
      }),
    );
    expect(result.messages.map((message) => message.id)).toEqual([
      FIRST_MESSAGE_ID,
    ]);
    expect(result.nextCursor).toBeNull();
  });
});

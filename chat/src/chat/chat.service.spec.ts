import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

type TxClient = {
  message: {
    create: jest.Mock;
  };
  roomMember: {
    update: jest.Mock;
  };
};

type TransactionCallback<T> = (tx: TxClient) => Promise<T>;

describe('ChatService', () => {
  let service: ChatService;
  let queryRawMock: jest.Mock;
  let memberFindFirstMock: jest.Mock;
  let roomMemberFindFirstMock: jest.Mock;
  let rootMessageCreateMock: jest.Mock;
  let transactionMock: jest.Mock;
  let txMessageCreateMock: jest.Mock;
  let txRoomMemberUpdateMock: jest.Mock;

  beforeEach(() => {
    queryRawMock = jest.fn();
    memberFindFirstMock = jest.fn().mockResolvedValue({ id: 'member-1' });
    roomMemberFindFirstMock = jest
      .fn()
      .mockResolvedValue({ id: 'room-member-1' });
    rootMessageCreateMock = jest.fn();
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
          id: 'message-1',
          roomId: data.roomId,
          senderId: data.senderId,
          messageType: data.messageType,
          content: data.content,
          payload: null,
          createdAt: new Date('2026-03-31T00:00:00.000Z'),
        }),
    );
    txRoomMemberUpdateMock = jest.fn().mockResolvedValue({});

    const txClient: TxClient = {
      message: { create: txMessageCreateMock },
      roomMember: { update: txRoomMemberUpdateMock },
    };

    const runTransaction = <T>(callback: TransactionCallback<T>): Promise<T> =>
      callback(txClient);
    transactionMock = jest.fn(runTransaction);

    service = new ChatService({
      $queryRaw: queryRawMock,
      member: { findFirst: memberFindFirstMock },
      roomMember: { findFirst: roomMemberFindFirstMock, update: jest.fn() },
      message: { create: rootMessageCreateMock, findMany: jest.fn() },
      $transaction: transactionMock,
    } as unknown as PrismaService);
  });

  it('uses JWT subject as username and maps room summaries', async () => {
    queryRawMock.mockResolvedValue([
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

    const result = await service.getRooms('testuser');

    expect(queryRawMock).toHaveBeenCalledTimes(1);
    expect(queryRawMock).toHaveBeenCalledWith(
      expect.objectContaining({ values: ['testuser'] }),
    );
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
    queryRawMock.mockResolvedValue([
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

  it('stores trimmed content and updates lastReadMessageId in one transaction', async () => {
    const result = await service.sendMessage(
      '11111111-1111-1111-1111-111111111111',
      'tester',
      { content: '  hello world  ' },
    );

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(txMessageCreateMock).toHaveBeenCalledWith({
      data: {
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-1',
        messageType: 'TEXT',
        content: 'hello world',
      },
    });
    expect(txRoomMemberUpdateMock).toHaveBeenCalledWith({
      where: { id: 'room-member-1' },
      data: { lastReadMessageId: 'message-1' },
    });
    expect(rootMessageCreateMock).not.toHaveBeenCalled();
    expect(result.content).toBe('hello world');
  });

  it('validates max length after trimming', async () => {
    const content = `  ${'a'.repeat(1000)}  `;

    const result = await service.sendMessage(
      '11111111-1111-1111-1111-111111111111',
      'tester',
      { content },
    );

    expect(result.content).toBe('a'.repeat(1000));
    expect(txMessageCreateMock).toHaveBeenCalledWith({
      data: {
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-1',
        messageType: 'TEXT',
        content: 'a'.repeat(1000),
      },
    });
  });

  it('rejects empty trimmed content', async () => {
    await expect(
      service.sendMessage('11111111-1111-1111-1111-111111111111', 'tester', {
        content: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(transactionMock).not.toHaveBeenCalled();
  });
});

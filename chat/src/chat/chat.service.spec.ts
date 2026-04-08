import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { PollWaitSubscription } from './chat-poll-registry';
import {
  ChatService,
  DEFAULT_ROOM_MESSAGE_LIMIT,
  MAX_POLL_MESSAGES,
  MAX_ROOM_MESSAGE_LIMIT,
  MAX_POLL_TIMEOUT_SECONDS,
} from './chat.service';

type FindManyCall = {
  where: {
    roomId: string;
    createdAt?: { gt?: Date; gte?: Date };
    OR?: Array<{
      createdAt: Date | { gt?: Date; lt?: Date };
      id?: { gt?: string; lt?: string };
    }>;
  };
  orderBy: Array<{ createdAt?: 'asc' | 'desc'; id?: 'asc' | 'desc' }>;
  take: number;
};

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
  let roomMemberUpdateMock: jest.Mock;
  let chatRoomFindFirstMock: jest.Mock;
  let messageFindFirstMock: jest.Mock;
  let messageFindManyMock: jest.Mock;
  let messageCountMock: jest.Mock;
  let transactionMock: jest.Mock;
  let txMessageCreateMock: jest.Mock;
  let txRoomMemberUpdateMock: jest.Mock;
  let createRoomSubscriptionMock: jest.Mock;
  let cancelSubscriptionMock: jest.Mock;
  let notifyRoomMock: jest.Mock;

  beforeEach(() => {
    queryRawMock = jest.fn();
    memberFindFirstMock = jest.fn();
    roomMemberFindFirstMock = jest.fn();
    roomMemberUpdateMock = jest.fn().mockResolvedValue({});
    chatRoomFindFirstMock = jest.fn().mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
    });
    messageFindFirstMock = jest.fn();
    messageFindManyMock = jest.fn();
    messageCountMock = jest.fn();
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
    cancelSubscriptionMock = jest.fn();
    notifyRoomMock = jest.fn();
    createRoomSubscriptionMock = jest.fn(
      () =>
        ({
          completion: Promise.resolve('timed_out'),
          cancel: cancelSubscriptionMock,
        }) satisfies PollWaitSubscription,
    );

    service = new ChatService(
      {
        $queryRaw: queryRawMock,
        member: {
          findFirst: memberFindFirstMock,
        },
        roomMember: {
          findFirst: roomMemberFindFirstMock,
          update: roomMemberUpdateMock,
        },
        chatRoom: {
          findFirst: chatRoomFindFirstMock,
        },
        message: {
          findFirst: messageFindFirstMock,
          findMany: messageFindManyMock,
          count: messageCountMock,
        },
        $transaction: transactionMock,
      } as unknown as PrismaService,
      {
        createRoomSubscription: createRoomSubscriptionMock,
        notifyRoom: notifyRoomMock,
      } as never,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
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
    const queryCalls = queryRawMock.mock.calls as unknown as Array<
      Array<{ values: unknown[] }>
    >;
    const firstQuery = queryCalls[0][0];

    expect(queryRawMock).toHaveBeenCalledTimes(1);
    expect(firstQuery.values).toEqual(['testuser']);
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

  it('stores trimmed content, updates lastReadMessageId, and wakes room waiters', async () => {
    memberFindFirstMock.mockResolvedValue({ id: 'member-1' });
    roomMemberFindFirstMock.mockResolvedValue({ id: 'room-member-1' });

    const result = await service.sendMessage(
      '11111111-1111-1111-1111-111111111111',
      'tester',
      { content: '  hello world  ' },
    );

    expect(chatRoomFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: '11111111-1111-1111-1111-111111111111',
        isDisabled: false,
      },
      select: {
        id: true,
      },
    });
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
    expect(notifyRoomMock).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(result.content).toBe('hello world');
  });

  it('returns the latest room messages in ascending order', async () => {
    memberFindFirstMock.mockResolvedValue({ id: 'member-1' });
    roomMemberFindFirstMock.mockResolvedValue({
      id: 'room-member-1',
      lastReadMessageId: null,
    });
    messageFindManyMock.mockResolvedValue([
      {
        id: '00000000-0000-0000-0000-000000000003',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'third',
        payload: null,
        createdAt: new Date('2026-03-31T00:00:03.000Z'),
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'second',
        payload: null,
        createdAt: new Date('2026-03-31T00:00:02.000Z'),
      },
    ]);

    const result = await service.getRoomMessages(
      '11111111-1111-1111-1111-111111111111',
      'tester',
      {
        limit: DEFAULT_ROOM_MESSAGE_LIMIT,
      },
    );

    expect(messageFindManyMock).toHaveBeenCalledWith({
      where: {
        roomId: '11111111-1111-1111-1111-111111111111',
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: DEFAULT_ROOM_MESSAGE_LIMIT,
    });
    expect(result.map((message) => message.content)).toEqual([
      'second',
      'third',
    ]);
  });

  it('returns older room messages before the cursor in ascending order', async () => {
    const anchorCreatedAt = new Date('2026-03-31T00:00:03.000Z');

    memberFindFirstMock.mockResolvedValue({ id: 'member-1' });
    roomMemberFindFirstMock.mockResolvedValue({
      id: 'room-member-1',
      lastReadMessageId: null,
    });
    messageFindFirstMock.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000003',
      createdAt: anchorCreatedAt,
    });
    messageFindManyMock.mockResolvedValue([
      {
        id: '00000000-0000-0000-0000-000000000002',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'second',
        payload: null,
        createdAt: new Date('2026-03-31T00:00:02.000Z'),
      },
      {
        id: '00000000-0000-0000-0000-000000000001',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'first',
        payload: null,
        createdAt: new Date('2026-03-31T00:00:01.000Z'),
      },
    ]);

    const result = await service.getRoomMessages(
      '11111111-1111-1111-1111-111111111111',
      'tester',
      {
        beforeMessageId: '00000000-0000-0000-0000-000000000003',
        limit: 20,
      },
    );

    expect(result.map((message) => message.content)).toEqual([
      'first',
      'second',
    ]);
    expect(messageFindManyMock).toHaveBeenCalledWith({
      where: {
        roomId: '11111111-1111-1111-1111-111111111111',
        OR: [
          {
            createdAt: {
              lt: anchorCreatedAt,
            },
          },
          {
            createdAt: anchorCreatedAt,
            id: {
              lt: '00000000-0000-0000-0000-000000000003',
            },
          },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 20,
    });
  });

  it('rejects a room message limit above the supported maximum', async () => {
    await expect(
      service.getRoomMessages(
        '11111111-1111-1111-1111-111111111111',
        'tester',
        {
          limit: MAX_ROOM_MESSAGE_LIMIT + 1,
        },
      ),
    ).rejects.toThrow(
      `limit must be an integer between 1 and ${MAX_ROOM_MESSAGE_LIMIT}.`,
    );

    expect(memberFindFirstMock).not.toHaveBeenCalled();
  });

  it('marks the latest room message as read when no explicit cursor is provided', async () => {
    memberFindFirstMock.mockResolvedValue({ id: 'member-1' });
    roomMemberFindFirstMock.mockResolvedValue({
      id: 'room-member-1',
      lastReadMessageId: null,
    });
    messageFindFirstMock
      .mockResolvedValueOnce({
        id: '00000000-0000-0000-0000-000000000003',
      })
      .mockResolvedValueOnce({
        id: '00000000-0000-0000-0000-000000000003',
        createdAt: new Date('2026-03-31T00:00:03.000Z'),
      });
    messageCountMock.mockResolvedValue(0);

    const result = await service.markRoomRead(
      '11111111-1111-1111-1111-111111111111',
      'tester',
      {},
    );

    expect(roomMemberUpdateMock).toHaveBeenCalledWith({
      where: { id: 'room-member-1' },
      data: { lastReadMessageId: '00000000-0000-0000-0000-000000000003' },
    });
    expect(messageCountMock).toHaveBeenCalledWith({
      where: {
        roomId: '11111111-1111-1111-1111-111111111111',
        OR: [
          {
            createdAt: {
              gt: new Date('2026-03-31T00:00:03.000Z'),
            },
          },
          {
            createdAt: new Date('2026-03-31T00:00:03.000Z'),
            id: {
              gt: '00000000-0000-0000-0000-000000000003',
            },
          },
        ],
      },
    });
    expect(result).toEqual({
      roomId: '11111111-1111-1111-1111-111111111111',
      lastReadMessageId: '00000000-0000-0000-0000-000000000003',
      unreadCount: 0,
    });
  });

  it('stores an explicit read cursor and returns the remaining unread count', async () => {
    const anchorCreatedAt = new Date('2026-03-31T00:00:02.000Z');

    memberFindFirstMock.mockResolvedValue({ id: 'member-1' });
    roomMemberFindFirstMock.mockResolvedValue({
      id: 'room-member-1',
      lastReadMessageId: null,
    });
    messageFindFirstMock
      .mockResolvedValueOnce({
        id: '00000000-0000-0000-0000-000000000002',
      })
      .mockResolvedValueOnce({
        id: '00000000-0000-0000-0000-000000000002',
        createdAt: anchorCreatedAt,
      });
    messageCountMock.mockResolvedValue(1);

    const result = await service.markRoomRead(
      '11111111-1111-1111-1111-111111111111',
      'tester',
      {
        lastReadMessageId: '00000000-0000-0000-0000-000000000002',
      },
    );

    expect(roomMemberUpdateMock).toHaveBeenCalledWith({
      where: { id: 'room-member-1' },
      data: { lastReadMessageId: '00000000-0000-0000-0000-000000000002' },
    });
    expect(messageCountMock).toHaveBeenCalledWith({
      where: {
        roomId: '11111111-1111-1111-1111-111111111111',
        OR: [
          {
            createdAt: {
              gt: anchorCreatedAt,
            },
          },
          {
            createdAt: anchorCreatedAt,
            id: {
              gt: '00000000-0000-0000-0000-000000000002',
            },
          },
        ],
      },
    });
    expect(result).toEqual({
      roomId: '11111111-1111-1111-1111-111111111111',
      lastReadMessageId: '00000000-0000-0000-0000-000000000002',
      unreadCount: 1,
    });
  });

  it('rejects blank sendMessage content before touching the database transaction', async () => {
    await expect(
      service.sendMessage('11111111-1111-1111-1111-111111111111', 'tester', {
        content: '   ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(transactionMock).not.toHaveBeenCalled();
    expect(notifyRoomMock).not.toHaveBeenCalled();
  });

  it('rejects sendMessage when the caller is not an active room member', async () => {
    memberFindFirstMock.mockResolvedValue({ id: 'member-1' });
    roomMemberFindFirstMock.mockResolvedValue(null);

    await expect(
      service.sendMessage('11111111-1111-1111-1111-111111111111', 'tester', {
        content: 'hello',
      }),
    ).rejects.toThrow('Access to the chat room is denied.');

    expect(chatRoomFindFirstMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
    expect(notifyRoomMock).not.toHaveBeenCalled();
  });

  it('rejects sendMessage when the room is disabled', async () => {
    memberFindFirstMock.mockResolvedValue({ id: 'member-1' });
    roomMemberFindFirstMock.mockResolvedValue({ id: 'room-member-1' });
    chatRoomFindFirstMock.mockResolvedValue(null);

    await expect(
      service.sendMessage('11111111-1111-1111-1111-111111111111', 'tester', {
        content: 'hello',
      }),
    ).rejects.toThrow('Access to the chat room is denied.');

    expect(transactionMock).not.toHaveBeenCalled();
    expect(notifyRoomMock).not.toHaveBeenCalled();
  });

  it('returns new messages immediately when messages exist after the cursor', async () => {
    memberFindFirstMock.mockResolvedValue({
      id: 'member-1',
    });
    roomMemberFindFirstMock.mockResolvedValue({
      id: 'room-member-1',
    });
    messageFindFirstMock.mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      roomId: '11111111-1111-1111-1111-111111111111',
      createdAt: new Date('2026-03-31T00:00:00.000Z'),
    });
    messageFindManyMock.mockResolvedValue([
      {
        id: '00000000-0000-0000-0000-000000000002',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'hello',
        payload: null,
        createdAt: new Date('2026-03-31T00:00:05.000Z'),
      },
    ]);

    const result = await service.pollMessages({
      roomId: '11111111-1111-1111-1111-111111111111',
      sinceMessageId: '00000000-0000-0000-0000-000000000001',
      timeoutSeconds: MAX_POLL_TIMEOUT_SECONDS,
      username: 'tester',
    });

    expect(memberFindFirstMock).toHaveBeenCalledWith({
      where: {
        username: 'tester',
        isDeleted: false,
        isBanned: false,
      },
      select: {
        id: true,
      },
    });
    expect(roomMemberFindFirstMock).toHaveBeenCalledWith({
      where: {
        roomId: '11111111-1111-1111-1111-111111111111',
        memberId: 'member-1',
        deletedAt: null,
      },
      select: {
        id: true,
        lastReadMessageId: true,
      },
    });
    expect(chatRoomFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: '11111111-1111-1111-1111-111111111111',
        isDisabled: false,
      },
      select: {
        id: true,
      },
    });
    expect(createRoomSubscriptionMock).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      MAX_POLL_TIMEOUT_SECONDS * 1000,
      undefined,
    );
    expect(cancelSubscriptionMock).toHaveBeenCalledTimes(1);

    expect(result).toEqual([
      {
        id: '00000000-0000-0000-0000-000000000002',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'hello',
        payload: null,
        createdAt: '2026-03-31T00:00:05.000Z',
      },
    ]);
  });

  it('returns an empty array when the room wait times out', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-31T00:00:00.000Z'));

    memberFindFirstMock.mockResolvedValue({
      id: 'member-1',
    });
    roomMemberFindFirstMock.mockResolvedValue({
      id: 'room-member-1',
    });
    messageFindManyMock.mockResolvedValue([]);
    createRoomSubscriptionMock.mockReturnValue({
      completion: Promise.resolve('timed_out'),
      cancel: cancelSubscriptionMock,
    } satisfies PollWaitSubscription);

    const result = await service.pollMessages({
      roomId: '11111111-1111-1111-1111-111111111111',
      timeoutSeconds: MAX_POLL_TIMEOUT_SECONDS,
      username: 'tester',
    });

    const findManyCalls = messageFindManyMock.mock.calls as unknown as Array<
      [FindManyCall]
    >;
    const firstQueryArgs = findManyCalls[0][0];

    expect(firstQueryArgs).toEqual({
      where: {
        roomId: '11111111-1111-1111-1111-111111111111',
        createdAt: {
          gt: new Date('2026-03-31T00:00:00.000Z'),
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: MAX_POLL_MESSAGES,
    });
    expect(result).toEqual([]);
    expect(messageFindManyMock).toHaveBeenCalledTimes(1);
    expect(cancelSubscriptionMock).toHaveBeenCalledTimes(1);
  });

  it('re-queries the room after the registry notifies the waiter', async () => {
    memberFindFirstMock.mockResolvedValue({
      id: 'member-1',
    });
    roomMemberFindFirstMock.mockResolvedValue({
      id: 'room-member-1',
    });
    messageFindManyMock.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: '00000000-0000-0000-0000-000000000003',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'arrived-after-notify',
        payload: null,
        createdAt: new Date('2026-03-31T00:00:06.000Z'),
      },
    ]);
    createRoomSubscriptionMock.mockReturnValue({
      completion: Promise.resolve('notified'),
      cancel: cancelSubscriptionMock,
    } satisfies PollWaitSubscription);

    const result = await service.pollMessages({
      roomId: '11111111-1111-1111-1111-111111111111',
      timeoutSeconds: MAX_POLL_TIMEOUT_SECONDS,
      username: 'tester',
    });

    expect(messageFindManyMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual([
      {
        id: '00000000-0000-0000-0000-000000000003',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'arrived-after-notify',
        payload: null,
        createdAt: '2026-03-31T00:00:06.000Z',
      },
    ]);
  });

  it('returns only messages after the anchor within the same timestamp order', async () => {
    const anchorCreatedAt = new Date('2026-03-31T00:00:00.000Z');

    memberFindFirstMock.mockResolvedValue({
      id: 'member-1',
    });
    roomMemberFindFirstMock.mockResolvedValue({
      id: 'room-member-1',
    });
    messageFindFirstMock.mockResolvedValue({
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      roomId: '11111111-1111-1111-1111-111111111111',
      createdAt: anchorCreatedAt,
    });
    messageFindManyMock.mockResolvedValue([
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'same-time-higher-id',
        payload: null,
        createdAt: anchorCreatedAt,
      },
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'later-message',
        payload: null,
        createdAt: new Date('2026-03-31T00:00:01.000Z'),
      },
    ]);

    const result = await service.pollMessages({
      roomId: '11111111-1111-1111-1111-111111111111',
      sinceMessageId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      timeoutSeconds: MAX_POLL_TIMEOUT_SECONDS,
      username: 'tester',
    });

    const findManyCalls = messageFindManyMock.mock.calls as unknown as Array<
      [FindManyCall]
    >;
    const secondQueryArgs = findManyCalls[0][0];

    expect(secondQueryArgs).toEqual({
      where: {
        roomId: '11111111-1111-1111-1111-111111111111',
        OR: [
          {
            createdAt: {
              gt: anchorCreatedAt,
            },
          },
          {
            createdAt: anchorCreatedAt,
            id: {
              gt: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            },
          },
        ],
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: MAX_POLL_MESSAGES,
    });

    expect(result).toEqual([
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'same-time-higher-id',
        payload: null,
        createdAt: anchorCreatedAt.toISOString(),
      },
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'later-message',
        payload: null,
        createdAt: '2026-03-31T00:00:01.000Z',
      },
    ]);
  });

  it('rejects a timeout above 25 seconds before querying the database', async () => {
    await expect(
      service.pollMessages({
        roomId: '11111111-1111-1111-1111-111111111111',
        timeoutSeconds: MAX_POLL_TIMEOUT_SECONDS + 1,
        username: 'tester',
      }),
    ).rejects.toThrow(
      `timeout must be an integer between 0 and ${MAX_POLL_TIMEOUT_SECONDS}.`,
    );

    expect(memberFindFirstMock).not.toHaveBeenCalled();
    expect(roomMemberFindFirstMock).not.toHaveBeenCalled();
    expect(messageFindManyMock).not.toHaveBeenCalled();
    expect(chatRoomFindFirstMock).not.toHaveBeenCalled();
  });
});

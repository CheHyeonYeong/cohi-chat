import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma/prisma.service';
import type { PollWaitSubscription } from './chat-poll-registry';
import {
  ChatService,
  MAX_POLL_MESSAGES,
  MAX_POLL_TIMEOUT_SECONDS,
} from './chat.service';

type FindManyCall = {
  where: {
    roomId: string;
    createdAt?: { gt?: Date };
    OR?: Array<{
      createdAt: Date | { gt?: Date };
      id?: { gt?: string };
    }>;
  };
  orderBy: Array<{ createdAt?: 'asc' | 'desc'; id?: 'asc' | 'desc' }>;
  take: number;
};

describe('ChatService', () => {
  let service: ChatService;
  let memberFindFirstMock: jest.Mock;
  let roomMemberFindFirstMock: jest.Mock;
  let chatRoomFindFirstMock: jest.Mock;
  let messageFindFirstMock: jest.Mock;
  let messageFindManyMock: jest.Mock;
  let createRoomSubscriptionMock: jest.Mock;
  let cancelSubscriptionMock: jest.Mock;

  beforeEach(() => {
    memberFindFirstMock = jest.fn();
    roomMemberFindFirstMock = jest.fn();
    chatRoomFindFirstMock = jest.fn().mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
    });
    messageFindFirstMock = jest.fn();
    messageFindManyMock = jest.fn();
    cancelSubscriptionMock = jest.fn();
    createRoomSubscriptionMock = jest.fn(
      () =>
        ({
          completion: Promise.resolve('timed_out'),
          cancel: cancelSubscriptionMock,
        }) satisfies PollWaitSubscription,
    );

    service = new ChatService(
      {
        member: {
          findFirst: memberFindFirstMock,
        },
        roomMember: {
          findFirst: roomMemberFindFirstMock,
        },
        chatRoom: {
          findFirst: chatRoomFindFirstMock,
        },
        message: {
          findFirst: messageFindFirstMock,
          findMany: messageFindManyMock,
        },
      } as unknown as PrismaService,
      {
        createRoomSubscription: createRoomSubscriptionMock,
      } as never,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('applies room membership validation before polling', async () => {
    memberFindFirstMock.mockResolvedValue({ id: 'member-1' });
    roomMemberFindFirstMock.mockResolvedValue(null);

    await expect(
      service.pollMessages({
        roomId: '11111111-1111-1111-1111-111111111111',
        timeoutSeconds: MAX_POLL_TIMEOUT_SECONDS,
        username: 'tester',
      }),
    ).rejects.toThrow('Access to the chat room is denied.');

    expect(createRoomSubscriptionMock).not.toHaveBeenCalled();
    expect(messageFindManyMock).not.toHaveBeenCalled();
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

  it('rejects a cursor that does not belong to the specified room', async () => {
    memberFindFirstMock.mockResolvedValue({
      id: 'member-1',
    });
    roomMemberFindFirstMock.mockResolvedValue({
      id: 'room-member-1',
    });
    messageFindFirstMock.mockResolvedValue(null);

    await expect(
      service.pollMessages({
        roomId: '11111111-1111-1111-1111-111111111111',
        sinceMessageId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        timeoutSeconds: MAX_POLL_TIMEOUT_SECONDS,
        username: 'tester',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

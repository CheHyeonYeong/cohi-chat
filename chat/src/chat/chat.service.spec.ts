import type { PrismaService } from '../prisma/prisma.service';
import {
  ChatService,
  MAX_POLL_MESSAGES,
  MAX_POLL_TIMEOUT_SECONDS,
} from './chat.service';

type FindManyCall = {
  where: {
    roomId: string;
    createdAt?: { gt?: Date; gte?: Date };
  };
  orderBy: Array<{ createdAt?: 'asc' | 'desc'; id?: 'asc' | 'desc' }>;
  take: number;
};

describe('ChatService', () => {
  let service: ChatService;
  let queryRawMock: jest.Mock;
  let memberFindFirstMock: jest.Mock;
  let roomMemberFindFirstMock: jest.Mock;
  let chatRoomFindFirstMock: jest.Mock;
  let messageFindFirstMock: jest.Mock;
  let messageFindManyMock: jest.Mock;

  beforeEach(() => {
    queryRawMock = jest.fn();
    memberFindFirstMock = jest.fn();
    roomMemberFindFirstMock = jest.fn();
    chatRoomFindFirstMock = jest.fn().mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
    });
    messageFindFirstMock = jest.fn();
    messageFindManyMock = jest.fn();

    service = new ChatService({
      $queryRaw: queryRawMock,
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
    } as unknown as PrismaService);
  });

  afterEach(() => {
    jest.useRealTimers();
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

    expect(roomMemberFindFirstMock).toHaveBeenCalledWith({
      where: {
        roomId: '11111111-1111-1111-1111-111111111111',
        memberId: 'member-1',
        deletedAt: null,
      },
      select: {
        id: true,
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

  it('waits up to the timeout before returning an empty array when there are no new messages', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-31T00:00:00.000Z'));

    memberFindFirstMock.mockResolvedValue({
      id: 'member-1',
    });
    roomMemberFindFirstMock.mockResolvedValue({
      id: 'room-member-1',
    });
    messageFindManyMock.mockResolvedValue([]);

    const resultPromise = service.pollMessages({
      roomId: '11111111-1111-1111-1111-111111111111',
      timeoutSeconds: MAX_POLL_TIMEOUT_SECONDS,
      username: 'tester',
    });

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

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

    await jest.advanceTimersByTimeAsync(24_000);

    const sentinel = Symbol('pending');
    await expect(
      Promise.race([resultPromise, Promise.resolve(sentinel)]),
    ).resolves.toBe(sentinel);

    await jest.advanceTimersByTimeAsync(1_000);

    await expect(resultPromise).resolves.toEqual([]);
  });

  it('returns same-timestamp messages except the anchor to avoid missing messages when UUID order differs', async () => {
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
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'same-time-lower-id',
        payload: null,
        createdAt: anchorCreatedAt,
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'anchor',
        payload: null,
        createdAt: anchorCreatedAt,
      },
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
        createdAt: {
          gte: anchorCreatedAt,
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: MAX_POLL_MESSAGES + 1,
    });

    expect(result).toEqual([
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        roomId: '11111111-1111-1111-1111-111111111111',
        senderId: 'member-2',
        messageType: 'TEXT',
        content: 'same-time-lower-id',
        payload: null,
        createdAt: anchorCreatedAt.toISOString(),
      },
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

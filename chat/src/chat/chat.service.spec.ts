import type { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';
import { NotFoundException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;
  let queryRawMock: jest.Mock;
  let memberFindFirstMock: jest.Mock;
  let chatRoomFindFirstMock: jest.Mock;
  let roomMemberFindFirstMock: jest.Mock;
  let messageFindFirstMock: jest.Mock;
  let roomMemberUpdateManyMock: jest.Mock;

  beforeEach(() => {
    queryRawMock = jest.fn();
    memberFindFirstMock = jest.fn();
    chatRoomFindFirstMock = jest.fn();
    roomMemberFindFirstMock = jest.fn();
    messageFindFirstMock = jest.fn();
    roomMemberUpdateManyMock = jest.fn();
    service = new ChatService({
      $queryRaw: queryRawMock,
      member: {
        findFirst: memberFindFirstMock,
      },
      chatRoom: {
        findFirst: chatRoomFindFirstMock,
      },
      roomMember: {
        findFirst: roomMemberFindFirstMock,
        updateMany: roomMemberUpdateManyMock,
      },
      message: {
        findFirst: messageFindFirstMock,
      },
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
    expect(queryRawMock.mock.calls[0][0].values).toEqual(['testuser']);
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

  it('marks the latest room message as read for the current member', async () => {
    memberFindFirstMock.mockResolvedValue({ id: 'member-1' });
    chatRoomFindFirstMock.mockResolvedValue({ id: 'room-1' });
    roomMemberFindFirstMock.mockResolvedValue({
      id: 'room-member-1',
      roomId: 'room-1',
      memberId: 'member-1',
    });
    messageFindFirstMock.mockResolvedValue({ id: 'message-9' });
    roomMemberUpdateManyMock.mockResolvedValue({ count: 1 });

    await service.markRoomAsRead('room-1', 'testuser');

    expect(memberFindFirstMock).toHaveBeenCalledWith({
      where: {
        username: 'testuser',
        isDeleted: false,
        isBanned: false,
      },
      select: { id: true },
    });
    expect(chatRoomFindFirstMock).toHaveBeenCalledWith({
      where: {
        id: 'room-1',
        isDisabled: false,
      },
      select: { id: true },
    });
    expect(roomMemberFindFirstMock).toHaveBeenCalledWith({
      where: {
        roomId: 'room-1',
        memberId: 'member-1',
        deletedAt: null,
      },
      select: { id: true },
    });
    expect(messageFindFirstMock).toHaveBeenCalledWith({
      where: { roomId: 'room-1' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true },
    });
    expect(roomMemberUpdateManyMock).toHaveBeenCalledWith({
      where: {
        roomId: 'room-1',
        memberId: 'member-1',
        deletedAt: null,
      },
      data: {
        lastReadMessageId: 'message-9',
        updatedAt: expect.any(Date),
      },
    });
  });

  it('throws a generic not found error when the user is not an active room member', async () => {
    memberFindFirstMock.mockResolvedValue({ id: 'member-1' });
    roomMemberFindFirstMock.mockResolvedValue(null);

    await expect(
      service.markRoomAsRead('550e8400-e29b-41d4-a716-446655440000', 'testuser'),
    ).rejects.toThrow(
      new NotFoundException('채팅방을 찾을 수 없거나 접근 권한이 없습니다.'),
    );

    expect(chatRoomFindFirstMock).not.toHaveBeenCalled();
    expect(messageFindFirstMock).not.toHaveBeenCalled();
    expect(roomMemberUpdateManyMock).not.toHaveBeenCalled();
  });
});

import { UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const createChatServiceMock = () => ({
  getRooms: jest.fn(),
  getUnreadSummary: jest.fn(),
  markRoomAsRead: jest.fn(),
});

describe('ChatController', () => {
  let controller: ChatController;
  let chatService: ReturnType<typeof createChatServiceMock>;

  beforeEach(() => {
    chatService = createChatServiceMock();
    controller = new ChatController(chatService as unknown as ChatService);
  });

  it('prefers sub over username when listing rooms', async () => {
    chatService.getRooms.mockResolvedValue([]);

    await controller.getRooms({
      user: {
        sub: '11111111-1111-1111-1111-111111111111',
        username: 'stale-username',
      },
    } as FastifyRequest);

    expect(chatService.getRooms).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
    );
  });

  it('falls back to username when sub is missing', async () => {
    chatService.getUnreadSummary.mockResolvedValue({
      totalUnread: 0,
      rooms: [],
    });

    await controller.getUnreadSummary({
      user: {
        username: 'tester',
      },
    } as FastifyRequest);

    expect(chatService.getUnreadSummary).toHaveBeenCalledWith('tester');
  });

  it('throws unauthorized when no member identifier exists', () => {
    expect(() =>
      controller.markRoomAsRead({ user: {} } as FastifyRequest, 'room-id'),
    ).toThrow(UnauthorizedException);

    expect(chatService.markRoomAsRead).not.toHaveBeenCalled();
  });
});

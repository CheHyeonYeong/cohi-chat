import type { FastifyRequest } from 'fastify';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  let controller: ChatController;
  let markRoomAsReadMock: jest.Mock;

  beforeEach(() => {
    markRoomAsReadMock = jest.fn();
    controller = new ChatController({
      getRooms: jest.fn(),
      markRoomAsRead: markRoomAsReadMock,
    } as unknown as ChatService);
  });

  it('marks the requested room as read for the authenticated user', async () => {
    await controller.markRoomAsRead(
      'room-1',
      {
        user: { sub: 'testuser' },
      } as FastifyRequest,
    );

    expect(markRoomAsReadMock).toHaveBeenCalledWith('room-1', 'testuser');
  });
});

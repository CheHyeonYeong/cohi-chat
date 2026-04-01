import { UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const createRequest = (username?: string): FastifyRequest =>
  ({
    user: username ? { sub: username, role: 'GUEST' } : undefined,
  }) as FastifyRequest;

describe('ChatController', () => {
  it('delegates room list lookups with the authenticated username', async () => {
    const getRooms = jest.fn().mockResolvedValue([]);
    const controller = new ChatController({
      getRooms,
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
    } as unknown as ChatService);

    await controller.getRooms(createRequest('tester'));

    expect(getRooms).toHaveBeenCalledWith('tester');
  });

  it('falls back to the default page size when size is missing or invalid', async () => {
    const getMessages = jest.fn().mockResolvedValue({
      messages: [],
      nextCursor: null,
    });
    const controller = new ChatController({
      getRooms: jest.fn(),
      getMessages,
      sendMessage: jest.fn(),
    } as unknown as ChatService);

    await controller.getMessages(
      '11111111-1111-1111-1111-111111111111',
      undefined,
      'abc',
      createRequest('tester'),
    );

    expect(getMessages).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      'tester',
      undefined,
      50,
    );
  });

  it('throws when the authenticated user is missing', async () => {
    const controller = new ChatController({
      getRooms: jest.fn(),
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
    } as unknown as ChatService);

    await expect(
      controller.sendMessage(
        '11111111-1111-1111-1111-111111111111',
        { content: 'hello' },
        createRequest(),
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

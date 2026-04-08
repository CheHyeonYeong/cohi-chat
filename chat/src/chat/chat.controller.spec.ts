import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const createRequest = (username?: string): FastifyRequest =>
  ({
    user: username ? { sub: username, role: 'GUEST' } : undefined,
  }) as FastifyRequest;

describe('ChatController', () => {
  it('falls back to the default page size when size is missing', async () => {
    const getMessages = jest.fn().mockResolvedValue({
      messages: [],
      nextCursor: null,
    });
    const controller = new ChatController({
      getMessages,
      sendMessage: jest.fn(),
    } as unknown as ChatService);

    await controller.getMessages(
      '11111111-1111-1111-1111-111111111111',
      undefined,
      undefined,
      createRequest('tester'),
    );

    expect(getMessages).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      'tester',
      undefined,
      50,
    );
  });

  it('caps the page size at the maximum value', async () => {
    const getMessages = jest.fn().mockResolvedValue({
      messages: [],
      nextCursor: null,
    });
    const controller = new ChatController({
      getMessages,
      sendMessage: jest.fn(),
    } as unknown as ChatService);

    await controller.getMessages(
      '11111111-1111-1111-1111-111111111111',
      undefined,
      '500',
      createRequest('tester'),
    );

    expect(getMessages).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      'tester',
      undefined,
      100,
    );
  });

  it('rejects non-positive or non-numeric page sizes', async () => {
    const controller = new ChatController({
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
    } as unknown as ChatService);

    await expect(
      controller.getMessages(
        '11111111-1111-1111-1111-111111111111',
        undefined,
        '0',
        createRequest('tester'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      controller.getMessages(
        '11111111-1111-1111-1111-111111111111',
        undefined,
        'abc',
        createRequest('tester'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when the authenticated user is missing', async () => {
    const controller = new ChatController({
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

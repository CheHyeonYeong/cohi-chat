import { BadRequestException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { EventEmitter } from 'node:events';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

describe('ChatController', () => {
  it('rejects a timeout that is not a pure integer string', async () => {
    const pollMessages = jest.fn();
    const controller = new ChatController({
      getRooms: jest.fn(),
      pollMessages,
    } as unknown as ChatService);

    const request = {
      user: {
        sub: 'tester',
      },
      raw: new EventEmitter(),
    } as FastifyRequest;

    await expect(
      controller.pollMessages(
        '11111111-1111-1111-1111-111111111111',
        undefined,
        '25abc',
        request,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(pollMessages).not.toHaveBeenCalled();
  });
});

import { BadRequestException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { EventEmitter } from 'node:events';
import { ChatController } from './chat.controller';
import { ChatService, MAX_POLL_TIMEOUT_SECONDS } from './chat.service';

const VALID_ROOM_ID = '11111111-1111-1111-1111-111111111111';
const VALID_SINCE_MESSAGE_ID = '22222222-2222-2222-2222-222222222222';

const createRequest = (): FastifyRequest => {
  const raw = new EventEmitter() as EventEmitter & {
    aborted?: boolean;
    socket?: EventEmitter;
  };
  raw.aborted = false;
  raw.socket = new EventEmitter();

  return {
    user: {
      sub: 'tester',
    },
    raw,
  } as FastifyRequest;
};

describe('ChatController', () => {
  it('forwards sendMessage requests to the service', async () => {
    const sendMessage = jest.fn().mockResolvedValue({
      id: '33333333-3333-3333-3333-333333333333',
      roomId: VALID_ROOM_ID,
      senderId: 'member-1',
      messageType: 'TEXT',
      content: 'hello',
      payload: null,
      createdAt: '2026-03-31T00:00:00.000Z',
    });
    const controller = new ChatController({
      getRooms: jest.fn(),
      sendMessage,
      pollMessages: jest.fn(),
    } as unknown as ChatService);

    await expect(
      controller.sendMessage(
        VALID_ROOM_ID,
        { content: 'hello' },
        createRequest(),
      ),
    ).resolves.toEqual({
      id: '33333333-3333-3333-3333-333333333333',
      roomId: VALID_ROOM_ID,
      senderId: 'member-1',
      messageType: 'TEXT',
      content: 'hello',
      payload: null,
      createdAt: '2026-03-31T00:00:00.000Z',
    });

    expect(sendMessage).toHaveBeenCalledWith(VALID_ROOM_ID, 'tester', {
      content: 'hello',
    });
  });

  it('uses the default 25 second timeout and listens for request close only while polling', async () => {
    let resolvePoll:
      | ((value: Awaited<ReturnType<ChatService['pollMessages']>>) => void)
      | undefined;
    const pollMessages = jest.fn(
      () =>
        new Promise<Awaited<ReturnType<ChatService['pollMessages']>>>(
          (resolve) => {
            resolvePoll = resolve;
          },
        ),
    );
    const controller = new ChatController({
      getRooms: jest.fn(),
      sendMessage: jest.fn(),
      pollMessages,
    } as unknown as ChatService);
    const request = createRequest();
    const raw = request.raw as EventEmitter & { socket: EventEmitter };

    const pollPromise = controller.pollMessages(
      VALID_ROOM_ID,
      undefined,
      undefined,
      request,
    );

    const pollArgs = pollMessages.mock.calls[0]?.[0] as
      | Parameters<ChatService['pollMessages']>[0]
      | undefined;

    expect(pollArgs).toMatchObject({
      roomId: VALID_ROOM_ID,
      timeoutSeconds: MAX_POLL_TIMEOUT_SECONDS,
      username: 'tester',
    });
    expect(pollArgs?.abortSignal).toBeInstanceOf(AbortSignal);
    expect(raw.listenerCount('aborted')).toBe(1);
    expect(raw.socket.listenerCount('close')).toBe(1);

    resolvePoll?.([]);

    await expect(pollPromise).resolves.toEqual([]);
    expect(raw.listenerCount('aborted')).toBe(0);
    expect(raw.socket.listenerCount('close')).toBe(0);
  });

  it('aborts polling when the underlying socket closes', async () => {
    let resolvePoll:
      | ((value: Awaited<ReturnType<ChatService['pollMessages']>>) => void)
      | undefined;
    let abortSignal: AbortSignal | undefined;

    const pollMessages = jest.fn(
      (args: Parameters<ChatService['pollMessages']>[0]) => {
        abortSignal = args.abortSignal;

        return new Promise<Awaited<ReturnType<ChatService['pollMessages']>>>(
          (resolve) => {
            resolvePoll = resolve;
          },
        );
      },
    );
    const controller = new ChatController({
      getRooms: jest.fn(),
      sendMessage: jest.fn(),
      pollMessages,
    } as unknown as ChatService);
    const request = createRequest();
    const raw = request.raw as EventEmitter & { socket: EventEmitter };

    const pollPromise = controller.pollMessages(
      VALID_ROOM_ID,
      undefined,
      undefined,
      request,
    );

    raw.socket.emit('close');
    expect(abortSignal?.aborted).toBe(true);

    resolvePoll?.([]);

    await expect(pollPromise).resolves.toEqual([]);
  });

  it('rejects an invalid roomId format', async () => {
    const pollMessages = jest.fn();
    const controller = new ChatController({
      getRooms: jest.fn(),
      sendMessage: jest.fn(),
      pollMessages,
    } as unknown as ChatService);

    await expect(
      controller.pollMessages('not-a-uuid', undefined, '25', createRequest()),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(pollMessages).not.toHaveBeenCalled();
  });

  it('rejects an invalid sinceMessageId format', async () => {
    const pollMessages = jest.fn();
    const controller = new ChatController({
      getRooms: jest.fn(),
      sendMessage: jest.fn(),
      pollMessages,
    } as unknown as ChatService);

    await expect(
      controller.pollMessages(
        VALID_ROOM_ID,
        'invalid-uuid',
        '25',
        createRequest(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(pollMessages).not.toHaveBeenCalled();
  });

  it('rejects an explicitly empty sinceMessageId', async () => {
    const pollMessages = jest.fn();
    const controller = new ChatController({
      getRooms: jest.fn(),
      sendMessage: jest.fn(),
      pollMessages,
    } as unknown as ChatService);

    await expect(
      controller.pollMessages(VALID_ROOM_ID, '   ', '25', createRequest()),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(pollMessages).not.toHaveBeenCalled();
  });

  it('rejects a timeout that is not a pure integer string', async () => {
    const pollMessages = jest.fn();
    const controller = new ChatController({
      getRooms: jest.fn(),
      sendMessage: jest.fn(),
      pollMessages,
    } as unknown as ChatService);

    await expect(
      controller.pollMessages(
        VALID_ROOM_ID,
        undefined,
        '25abc',
        createRequest(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(pollMessages).not.toHaveBeenCalled();
  });

  it('rejects a timeout above the documented maximum', async () => {
    const pollMessages = jest.fn();
    const controller = new ChatController({
      getRooms: jest.fn(),
      sendMessage: jest.fn(),
      pollMessages,
    } as unknown as ChatService);

    await expect(
      controller.pollMessages(
        VALID_ROOM_ID,
        undefined,
        String(MAX_POLL_TIMEOUT_SECONDS + 1),
        createRequest(),
      ),
    ).rejects.toThrow(
      `timeout must be between 0 and ${MAX_POLL_TIMEOUT_SECONDS}.`,
    );
    expect(pollMessages).not.toHaveBeenCalled();
  });

  it('passes validated poll arguments to the service', async () => {
    const pollMessages = jest.fn().mockResolvedValue([]);
    const controller = new ChatController({
      getRooms: jest.fn(),
      sendMessage: jest.fn(),
      pollMessages,
    } as unknown as ChatService);

    await expect(
      controller.pollMessages(
        VALID_ROOM_ID,
        VALID_SINCE_MESSAGE_ID,
        '7',
        createRequest(),
      ),
    ).resolves.toEqual([]);

    expect(pollMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        roomId: VALID_ROOM_ID,
        sinceMessageId: VALID_SINCE_MESSAGE_ID,
        timeoutSeconds: 7,
        username: 'tester',
      }),
    );
  });
});

import { ChatPollRegistry } from './chat-poll-registry';

describe('ChatPollRegistry', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves when the matching room is notified', async () => {
    const registry = new ChatPollRegistry();
    const subscription = registry.createRoomSubscription('room-1', 1_000);

    registry.notifyRoom('room-1');

    await expect(subscription.completion).resolves.toBe('notified');
  });

  it('ignores notifications for other rooms and times out instead', async () => {
    jest.useFakeTimers();

    const registry = new ChatPollRegistry();
    const subscription = registry.createRoomSubscription('room-1', 1_000);

    registry.notifyRoom('room-2');
    await jest.advanceTimersByTimeAsync(1_000);

    await expect(subscription.completion).resolves.toBe('timed_out');
  });

  it('resolves as aborted when the request signal is already aborted', async () => {
    const registry = new ChatPollRegistry();
    const abortController = new AbortController();
    abortController.abort();

    const subscription = registry.createRoomSubscription(
      'room-1',
      1_000,
      abortController.signal,
    );

    await expect(subscription.completion).resolves.toBe('aborted');
  });

  it('resolves as aborted when cancel() is called', async () => {
    const registry = new ChatPollRegistry();
    const subscription = registry.createRoomSubscription('room-1', 1_000);

    subscription.cancel();

    await expect(subscription.completion).resolves.toBe('aborted');
  });
});

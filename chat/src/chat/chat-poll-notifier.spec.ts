import { ChatPollNotifier } from './chat-poll-notifier';
import { ChatPollRegistry } from './chat-poll-registry';

describe('ChatPollNotifier', () => {
  it('wakes same-room poll waiters immediately in the same process', async () => {
    const registry = new ChatPollRegistry();
    const notifier = new ChatPollNotifier(registry);
    const subscription = registry.createRoomSubscription('room-1', 1_000);

    notifier.notifyRoomActivity('room-1');

    await expect(subscription.completion).resolves.toBe('notified');
  });
});

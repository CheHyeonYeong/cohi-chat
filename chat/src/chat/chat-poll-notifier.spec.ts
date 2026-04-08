import { Test } from '@nestjs/testing';
import { ChatRoomActivityNotifier } from './chat-room-activity-notifier';
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

  it('resolves the shared ChatRoomActivityNotifier token to the poll notifier implementation', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ChatPollRegistry,
        ChatPollNotifier,
        {
          provide: ChatRoomActivityNotifier,
          useExisting: ChatPollNotifier,
        },
      ],
    }).compile();

    const registry = moduleRef.get(ChatPollRegistry);
    const notifier = moduleRef.get(ChatRoomActivityNotifier);
    const concreteNotifier = moduleRef.get(ChatPollNotifier);
    const subscription = registry.createRoomSubscription('room-1', 1_000);

    expect(notifier).toBe(concreteNotifier);

    notifier.notifyRoomActivity('room-1');

    await expect(subscription.completion).resolves.toBe('notified');
  });
});

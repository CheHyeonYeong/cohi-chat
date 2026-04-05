import { Injectable } from '@nestjs/common';

export type PollWaitResult = 'notified' | 'timed_out' | 'aborted';

export type PollWaitSubscription = {
  completion: Promise<PollWaitResult>;
  cancel: () => void;
};

@Injectable()
export class ChatPollRegistry {
  private readonly roomListeners = new Map<string, Set<() => void>>();

  createRoomSubscription(
    roomId: string,
    timeoutMs: number,
    abortSignal?: AbortSignal,
  ): PollWaitSubscription {
    let settled = false;
    let resolveCompletion: (result: PollWaitResult) => void = () => {};

    const completion = new Promise<PollWaitResult>((resolve) => {
      resolveCompletion = resolve;
    });

    const listeners = this.roomListeners.get(roomId) ?? new Set<() => void>();
    this.roomListeners.set(roomId, listeners);

    const listener = () => {
      settle('notified');
    };

    const abortHandler = () => {
      settle('aborted');
    };

    const timeoutHandle = setTimeout(() => {
      settle('timed_out');
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timeoutHandle);
      abortSignal?.removeEventListener('abort', abortHandler);
      listeners.delete(listener);

      if (listeners.size === 0) {
        this.roomListeners.delete(roomId);
      }
    };

    const settle = (result: PollWaitResult) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolveCompletion(result);
    };

    listeners.add(listener);

    if (abortSignal?.aborted) {
      settle('aborted');
    } else {
      abortSignal?.addEventListener('abort', abortHandler, { once: true });
    }

    return {
      completion,
      cancel: () => {
        settle('aborted');
      },
    };
  }

  notifyRoom(roomId: string): void {
    const listeners = this.roomListeners.get(roomId);
    if (!listeners) {
      return;
    }

    for (const listener of [...listeners]) {
      listener();
    }
  }
}

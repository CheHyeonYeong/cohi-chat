import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookingsSSEQuery } from './useBookingsSSE';

class MockEventSource {
    static instances: MockEventSource[] = [];

    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent<string>) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    close = vi.fn();

    constructor(
        public readonly url: string,
        public readonly eventSourceInitDict?: EventSourceInit,
    ) {
        MockEventSource.instances.push(this);
    }

    emitOpen(event = new Event('open')) {
        this.onopen?.(event);
    }

    emitMessage(data: string) {
        this.onmessage?.(new MessageEvent('message', { data }));
    }

    emitError(event = new Event('error')) {
        this.onerror?.(event);
    }

    static reset() {
        MockEventSource.instances = [];
    }
}

describe('useBookingsSSEQuery', () => {
    const originalEventSource = globalThis.EventSource;

    beforeEach(() => {
        MockEventSource.reset();
        vi.stubGlobal('EventSource', MockEventSource);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        if (originalEventSource) {
            globalThis.EventSource = originalEventSource;
        }
    });

    it('clears stale connectionError after reconnect and message resume', async () => {
        const { result } = renderHook(() =>
            useBookingsSSEQuery({ endpoint: '/bookings/stream' }),
        );

        const eventSource = MockEventSource.instances[0];
        const errorEvent = new Event('error');

        act(() => {
            eventSource.emitError(errorEvent);
        });

        await waitFor(() => {
            expect(result.current.connectionError).toBe(errorEvent);
        });

        act(() => {
            eventSource.emitOpen();
        });

        await waitFor(() => {
            expect(result.current.connectionError).toBeNull();
        });

        act(() => {
            eventSource.emitError(errorEvent);
        });

        await waitFor(() => {
            expect(result.current.connectionError).toBe(errorEvent);
        });

        act(() => {
            eventSource.emitMessage(JSON.stringify({
                id: 1,
                started_at: '2026-03-15T10:00:00Z',
                ended_at: '2026-03-15T11:00:00Z',
            }));
        });

        await waitFor(() => {
            expect(result.current.connectionError).toBeNull();
            expect(result.current.data).toEqual([
                {
                    id: 1,
                    startedAt: '2026-03-15T10:00:00Z',
                    endedAt: '2026-03-15T11:00:00Z',
                },
            ]);
        });
    });
});

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

    it('uses the latest onMessage callback without recreating the EventSource', async () => {
        const firstHandler = vi.fn();
        const secondHandler = vi.fn();

        const { rerender } = renderHook(
            ({ onMessage }) => useBookingsSSEQuery({ endpoint: '/sse/bookings', onMessage }),
            { initialProps: { onMessage: firstHandler } }
        );

        expect(MockEventSource.instances).toHaveLength(1);

        rerender({ onMessage: secondHandler });

        act(() => {
            MockEventSource.instances[0].emitMessage(JSON.stringify({ id: 1, started_at: '2026-03-15T10:00:00Z', ended_at: '2026-03-15T11:00:00Z' }));
        });

        await waitFor(() => {
            expect(secondHandler).toHaveBeenCalledTimes(1);
        });
        expect(firstHandler).not.toHaveBeenCalled();
        expect(MockEventSource.instances).toHaveLength(1);
    });

    it('keeps the EventSource open on error so the browser can reconnect automatically', async () => {
        const { result } = renderHook(() =>
            useBookingsSSEQuery({ endpoint: '/sse/bookings' })
        );

        expect(MockEventSource.instances).toHaveLength(1);
        const source = MockEventSource.instances[0];

        act(() => {
            source.emitError();
        });

        await waitFor(() => {
            expect(result.current.connectionError).not.toBeNull();
        });
        expect(source.close).not.toHaveBeenCalled();

        act(() => {
            source.emitOpen();
        });

        await waitFor(() => {
            expect(result.current.connectionError).toBeNull();
        });
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

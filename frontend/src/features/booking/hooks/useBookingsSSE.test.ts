import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBookingsSSEQuery } from './useBookingsSSE';

class MockEventSource {
    static instances: MockEventSource[] = [];

    url: string;
    withCredentials: boolean;
    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent<string>) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;
    close = vi.fn();

    constructor(url: string, init?: EventSourceInit) {
        this.url = url;
        this.withCredentials = init?.withCredentials ?? false;
        MockEventSource.instances.push(this);
    }

    emitOpen() {
        this.onopen?.(new Event('open'));
    }

    emitMessage(data: unknown) {
        this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
    }

    emitError() {
        this.onerror?.(new Event('error'));
    }
}

describe('useBookingsSSEQuery', () => {
    beforeEach(() => {
        MockEventSource.instances = [];
        vi.stubGlobal('EventSource', MockEventSource as unknown as typeof EventSource);
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
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
            MockEventSource.instances[0].emitMessage({ id: 1, started_at: '2026-03-15T10:00:00Z', ended_at: '2026-03-15T11:00:00Z' });
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
});

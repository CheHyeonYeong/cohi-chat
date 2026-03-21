import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { httpClient } from './httpClient';

function createJsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('httpClient', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        globalThis.fetch = originalFetch;
    });

    it('sends requests with credentials include', async () => {
        const fetchMock = vi.fn().mockResolvedValue(createJsonResponse({ success: true, data: { ok: true } }));
        globalThis.fetch = fetchMock as typeof fetch;

        const response = await httpClient<{ ok: boolean }>('http://localhost:8080/api/members/v1/hosts');

        expect(response.ok).toBe(true);
        expect(fetchMock).toHaveBeenCalledWith(
            'http://localhost:8080/api/members/v1/hosts',
            expect.objectContaining({ credentials: 'include' }),
        );
    });

    it('dispatches auth-change when refresh retry fails after 401', async () => {
        const authChangeHandler = vi.fn();
        window.addEventListener('auth-change', authChangeHandler);

        const fetchMock = vi.fn()
            .mockResolvedValueOnce(createJsonResponse({ error: { message: 'unauthorized' } }, 401))
            .mockResolvedValueOnce(createJsonResponse({ error: { message: 'refresh failed' } }, 401));
        globalThis.fetch = fetchMock as typeof fetch;

        try {
            await expect(
                httpClient('http://localhost:8080/api/members/v1/testuser'),
            ).rejects.toThrow();
        } finally {
            window.removeEventListener('auth-change', authChangeHandler);
        }

        expect(authChangeHandler).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'http://localhost:8080/api/members/v1/refresh',
            expect.objectContaining({ credentials: 'include', method: 'POST' }),
        );
    });

    it('does not dispatch auth-change when clearAuthOnFailure is false', async () => {
        const authChangeHandler = vi.fn();
        window.addEventListener('auth-change', authChangeHandler);

        const fetchMock = vi.fn()
            .mockResolvedValueOnce(createJsonResponse({ error: { message: 'unauthorized' } }, 401))
            .mockResolvedValueOnce(createJsonResponse({ error: { message: 'refresh failed' } }, 401));
        globalThis.fetch = fetchMock as typeof fetch;

        try {
            await expect(
                httpClient('http://localhost:8080/api/members/v1/me', { clearAuthOnFailure: false }),
            ).rejects.toThrow();
        } finally {
            window.removeEventListener('auth-change', authChangeHandler);
        }

        expect(authChangeHandler).not.toHaveBeenCalled();
    });
});

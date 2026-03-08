import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { httpClient } from '~/libs/httpClient';

function mockResponse(status: number, body: unknown): Response {
    return {
        status,
        ok: status >= 200 && status < 300,
        json: vi.fn().mockResolvedValue(body),
        text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
    } as unknown as Response;
}

describe('httpClient auth refresh behavior', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not try refresh for login endpoint 401 and keeps backend message', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            mockResponse(401, { error: { message: 'Password does not match.' } })
        );

        localStorage.setItem('refresh_token', 'stale-refresh-token');

        await expect(
            httpClient('/api/members/v1/login', {
                method: 'POST',
                body: { username: 'user1', password: 'wrong' },
            })
        ).rejects.toThrow('Password does not match.');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/members/v1/login',
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('retries once with refreshed token for protected endpoint 401', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(mockResponse(401, { error: { message: 'Access token expired.' } }))
            .mockResolvedValueOnce(mockResponse(200, {
                success: true,
                data: { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' },
            }))
            .mockResolvedValueOnce(mockResponse(200, {
                success: true,
                data: { username: 'user1' },
            }));

        localStorage.setItem('auth_token', 'old-access-token');
        localStorage.setItem('refresh_token', 'old-refresh-token');

        const data = await httpClient<{ username: string }>('/api/members/v1/user1');

        expect(data).toEqual({ username: 'user1' });
        expect(localStorage.getItem('auth_token')).toBe('new-access-token');
        expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });
});

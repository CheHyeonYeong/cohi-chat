import { describe, it, expect, vi, afterEach } from 'vitest';
import { httpClient } from '../httpClient';

const API_BASE = 'http://localhost:8080/api';

function makeResponse(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('httpClient - skipAuthRefresh option', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not attempt refresh when skipAuthRefresh is true', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            makeResponse({ error: { message: '아이디 또는 비밀번호가 올바르지 않습니다.' } }, 401),
        );

        await expect(
            httpClient(`${API_BASE}/members/v1/login`, { method: 'POST', skipAuthRefresh: true }),
        ).rejects.toThrow('아이디 또는 비밀번호가 올바르지 않습니다.');

        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
});

describe('httpClient - GRACE_WINDOW_HIT handling', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('preserves auth state and throws retryable error on GRACE_WINDOW_HIT', async () => {
        const authChangeHandler = vi.fn();
        window.addEventListener('auth-change', authChangeHandler);

        try {
            vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
                const url = input.toString();
                if (url.includes('/members/v1/refresh')) {
                    return Promise.resolve(
                        makeResponse(
                            { success: false, error: { code: 'GRACE_WINDOW_HIT', message: '세션 무효화' } },
                            401,
                        ),
                    );
                }
                return Promise.resolve(makeResponse({}, 401));
            });

            await expect(httpClient(`${API_BASE}/some-endpoint`)).rejects.toThrow(
                '토큰 재발급 대기 중입니다. 다시 시도해 주세요.',
            );

            expect(authChangeHandler).not.toHaveBeenCalled();
        } finally {
            window.removeEventListener('auth-change', authChangeHandler);
        }
    });

    it('dispatches auth-change on general refresh failure', async () => {
        const authChangeHandler = vi.fn();
        window.addEventListener('auth-change', authChangeHandler);

        try {
            vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
                const url = input.toString();
                if (url.includes('/members/v1/refresh')) {
                    return Promise.resolve(
                        makeResponse({ success: false, error: { code: 'EXPIRED_REFRESH_TOKEN' } }, 401),
                    );
                }
                return Promise.resolve(makeResponse({}, 401));
            });

            await expect(httpClient(`${API_BASE}/some-endpoint`)).rejects.toThrow(
                '인증이 만료되었습니다. 다시 로그인해 주세요.',
            );

            expect(authChangeHandler).toHaveBeenCalledTimes(1);
        } finally {
            window.removeEventListener('auth-change', authChangeHandler);
        }
    });

    it('retries the original request after successful refresh', async () => {
        let someEndpointCallCount = 0;
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
            const url = input.toString();
            if (url.includes('/members/v1/refresh')) {
                return Promise.resolve(makeResponse({ success: true }, 200));
            }
            someEndpointCallCount++;
            if (someEndpointCallCount === 1) {
                return Promise.resolve(makeResponse({}, 401));
            }
            return Promise.resolve(makeResponse({ success: true, data: { ok: true } }, 200));
        });

        const result = await httpClient<{ ok: boolean }>(`${API_BASE}/some-endpoint`);

        expect(result).toEqual({ ok: true });
        expect(fetchSpy).toHaveBeenCalledTimes(3);
    });
});

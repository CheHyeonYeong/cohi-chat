import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { httpClient } from '../httpClient';

const API_BASE = 'http://localhost:8080/api';

function mockFetch(responses: Response[]) {
    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
        const res = responses[callCount] ?? responses[responses.length - 1];
        callCount++;
        return Promise.resolve(res);
    });
}

function makeResponse(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

describe('httpClient - GRACE_WINDOW_HIT 처리', () => {
    beforeEach(() => {
        localStorage.setItem('auth_token', 'expired-at');
        localStorage.setItem('refresh_token', 'old-rt');
        localStorage.setItem('username', 'testuser');
    });

    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('GRACE_WINDOW_HIT 수신 시 로컬 스토리지 토큰을 모두 삭제한다', async () => {
        // 첫 요청: 401 (AT 만료)
        // 리프레시 요청: GRACE_WINDOW_HIT 에러
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
            '인증이 만료되었습니다. 다시 로그인해주세요.',
        );

        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
        expect(localStorage.getItem('username')).toBeNull();
    });

    it('GRACE_WINDOW_HIT 수신 시 auth-change 이벤트를 발행한다', async () => {
        const authChangeHandler = vi.fn();
        window.addEventListener('auth-change', authChangeHandler);

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

        await expect(httpClient(`${API_BASE}/some-endpoint`)).rejects.toThrow();

        expect(authChangeHandler).toHaveBeenCalled();
        window.removeEventListener('auth-change', authChangeHandler);
    });

    it('일반 refresh 실패(null 반환) 시 토큰을 삭제하고 로그인 요구 에러를 던진다', async () => {
        mockFetch([
            makeResponse({}, 401), // 첫 요청 401
            makeResponse({ success: false, error: { code: 'EXPIRED_REFRESH_TOKEN' } }, 401), // refresh 실패
        ]);

        await expect(httpClient(`${API_BASE}/some-endpoint`)).rejects.toThrow(
            '인증이 만료되었습니다. 다시 로그인해주세요.',
        );

        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(localStorage.getItem('refresh_token')).toBeNull();
    });

    it('refresh 성공 시 토큰을 갱신하고 요청을 재시도한다', async () => {
        const newAt = 'new-access-token';
        const newRt = 'new-refresh-token';
        let callCount = 0;

        vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
            const url = input.toString();
            callCount++;
            if (url.includes('/members/v1/refresh')) {
                return Promise.resolve(
                    makeResponse({ data: { accessToken: newAt, refreshToken: newRt } }, 200),
                );
            }
            const headers = init?.headers as Record<string, string> | undefined;
            if (headers?.['Authorization'] === `Bearer ${newAt}`) {
                return Promise.resolve(makeResponse({ success: true, data: { ok: true } }, 200));
            }
            // 첫 호출은 401 (AT 만료 시뮬레이션)
            return Promise.resolve(makeResponse({}, 401));
        });

        const result = await httpClient<{ ok: boolean }>(`${API_BASE}/some-endpoint`);

        expect(result).toEqual({ ok: true });
        expect(localStorage.getItem('auth_token')).toBe(newAt);
        expect(localStorage.getItem('refresh_token')).toBe(newRt);
        expect(callCount).toBe(3); // 원래 요청(401) + refresh + 재시도(200)
    });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { httpClient } from '../httpClient';

const API_BASE = 'http://localhost:8080/api';

const makeResponse = (body: unknown, status: number): Response => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
});

describe('httpClient - skipAuthRefresh 옵션', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('skipAuthRefresh: true 설정 시 401 응답에서 refresh를 시도하지 않고 에러를 그대로 던진다', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            makeResponse({ error: { message: '아이디 또는 비밀번호가 올바르지 않습니다.' } }, 401),
        );

        await expect(
            httpClient(`${API_BASE}/members/v1/login`, { method: 'POST', skipAuthRefresh: true }),
        ).rejects.toThrow('아이디 또는 비밀번호가 올바르지 않습니다.');

        // refresh 엔드포인트를 호출하지 않아야 한다
        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
});

describe('httpClient - GRACE_WINDOW_HIT 처리', () => {
    beforeEach(() => {
        localStorage.setItem('username', 'testuser');
    });

    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
    });

    it('GRACE_WINDOW_HIT 수신 시 인증 상태를 유지하고 재시도 안내 에러를 던진다', async () => {
        // GRACE_WINDOW_HIT는 유예 기간 중 경쟁 상태(임시적). 사용자가 재시도할 수 있도록 인증 상태를 유지해야 함
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

        // 재시도 가능한 상태이므로 username을 삭제하지 않음
        expect(localStorage.getItem('username')).toBe('testuser');
    });

    it('GRACE_WINDOW_HIT 수신 시 auth-change 이벤트를 발행하지 않는다', async () => {
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

            await expect(httpClient(`${API_BASE}/some-endpoint`)).rejects.toThrow();

            // 인증 상태를 건드리지 않으므로 auth-change 이벤트 미발행
            expect(authChangeHandler).not.toHaveBeenCalled();
        } finally {
            window.removeEventListener('auth-change', authChangeHandler);
        }
    });

    it('일반 refresh 실패 시 username을 삭제하고 로그인 요구 에러를 던진다', async () => {
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

        expect(localStorage.getItem('username')).toBeNull();
    });

    it('refresh 성공 시 요청을 재시도한다', async () => {
        let someEndpointCallCount = 0;
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
            const url = input.toString();
            if (url.includes('/members/v1/refresh')) {
                return Promise.resolve(makeResponse({ success: true }, 200));
            }
            someEndpointCallCount++;
            if (someEndpointCallCount === 1) {
                return Promise.resolve(makeResponse({}, 401)); // 첫 번째 시도 → 401
            }
            return Promise.resolve(makeResponse({ success: true, data: { ok: true } }, 200)); // 재시도 → 성공
        });

        const result = await httpClient<{ ok: boolean }>(`${API_BASE}/some-endpoint`);

        expect(result).toEqual({ ok: true });
        expect(fetchSpy).toHaveBeenCalledTimes(3); // 원래 요청(401) + refresh + 재시도(200)
    });
});

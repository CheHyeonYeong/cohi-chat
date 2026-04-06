import { describe, it, expect, beforeEach } from 'vitest';
import { isValidRedirectPath, getSafeRedirectPath, saveRedirectUrl, popRedirectUrl } from './redirect';

describe('isValidRedirectPath', () => {
    it('유효한 내부 경로를 허용한다', () => {
        expect(isValidRedirectPath('/')).toBe(true);
        expect(isValidRedirectPath('/booking/my-bookings')).toBe(true);
        expect(isValidRedirectPath('/host/settings')).toBe(true);
        expect(isValidRedirectPath('/booking/my-bookings?page=2')).toBe(true);
    });

    it('외부 URL을 차단한다', () => {
        expect(isValidRedirectPath('https://evil.com')).toBe(false);
        expect(isValidRedirectPath('http://evil.com')).toBe(false);
    });

    it('protocol-relative URL을 차단한다', () => {
        expect(isValidRedirectPath('//evil.com')).toBe(false);
    });

    it('backslash를 차단한다', () => {
        expect(isValidRedirectPath('/\\evil.com')).toBe(false);
    });

    it('빈 값/null을 차단한다', () => {
        expect(isValidRedirectPath('')).toBe(false);
        expect(isValidRedirectPath(null as unknown as string)).toBe(false);
        expect(isValidRedirectPath(undefined as unknown as string)).toBe(false);
    });

    it('슬래시로 시작하지 않는 경로를 차단한다', () => {
        expect(isValidRedirectPath('booking/my-bookings')).toBe(false);
    });
});

describe('getSafeRedirectPath', () => {
    it('유효한 경로를 그대로 반환한다', () => {
        expect(getSafeRedirectPath('/booking/my-bookings')).toBe('/booking/my-bookings');
    });

    it('유효하지 않은 경로일 때 fallback을 반환한다', () => {
        expect(getSafeRedirectPath('https://evil.com')).toBe('/');
        expect(getSafeRedirectPath(undefined)).toBe('/');
    });

    it('커스텀 fallback을 사용할 수 있다', () => {
        expect(getSafeRedirectPath(undefined, '/home')).toBe('/home');
    });
});

describe('saveRedirectUrl / popRedirectUrl', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('유효한 경로를 저장하고 꺼낼 수 있다', () => {
        saveRedirectUrl('/booking/my-bookings');
        expect(popRedirectUrl()).toBe('/booking/my-bookings');
    });

    it('popRedirectUrl은 한 번 꺼내면 삭제된다', () => {
        saveRedirectUrl('/booking/my-bookings');
        popRedirectUrl();
        expect(popRedirectUrl()).toBeNull();
    });

    it('유효하지 않은 경로는 저장하지 않는다', () => {
        saveRedirectUrl('https://evil.com');
        expect(popRedirectUrl()).toBeNull();
    });

    it('저장된 값이 없으면 null을 반환한다', () => {
        expect(popRedirectUrl()).toBeNull();
    });
});

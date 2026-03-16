import { describe, it, expect } from 'vitest';
import { CALENDAR_ID_REGEX, validateCalendarData } from './validation';

describe('CALENDAR_ID_REGEX', () => {
    describe('유효한 이메일 형식', () => {
        it.each([
            'user@gmail.com',
            'test.user@domain.co.kr',
            'user+tag@example.org',
            'user_name@subdomain.example.com',
            'user123@test.io',
        ])('%s는 유효하다', (email) => {
            expect(CALENDAR_ID_REGEX.test(email)).toBe(true);
        });
    });

    describe('유효하지 않은 이메일 형식', () => {
        it.each([
            'userexample.com',
            '@example.com',
            'user@',
            'user@.com',
            'user@domain.',
            '',
        ])('%s는 유효하지 않다', (email) => {
            expect(CALENDAR_ID_REGEX.test(email)).toBe(false);
        });
    });
});

describe('validateCalendarData', () => {
    describe('topics 검증', () => {
        it('topics가 빈 배열이면 에러를 반환한다', () => {
            const errors = validateCalendarData({ topics: [] });

            expect(errors.topics).toBe('주제를 최소 1개 이상 입력해주세요.');
        });

        it('topics가 1개 이상이면 에러가 없다', () => {
            const errors = validateCalendarData({ topics: ['주제1'] });

            expect(errors.topics).toBeUndefined();
        });

        it('topics가 undefined면 검증하지 않는다', () => {
            const errors = validateCalendarData({});

            expect(errors.topics).toBeUndefined();
        });
    });

    describe('description 검증', () => {
        it('description이 10자 미만이면 에러를 반환한다', () => {
            const errors = validateCalendarData({ description: '짧은설명' });

            expect(errors.description).toBe('소개는 최소 10자 이상 입력해주세요.');
        });

        it('description이 공백만 있으면 에러를 반환한다', () => {
            const errors = validateCalendarData({ description: '          ' });

            expect(errors.description).toBe('소개는 최소 10자 이상 입력해주세요.');
        });

        it('description이 10자 이상이면 에러가 없다', () => {
            const errors = validateCalendarData({ description: '이것은 충분히 긴 설명입니다.' });

            expect(errors.description).toBeUndefined();
        });

        it('description이 undefined면 검증하지 않는다', () => {
            const errors = validateCalendarData({});

            expect(errors.description).toBeUndefined();
        });
    });

    describe('googleCalendarId 검증', () => {
        it('googleCalendarId가 빈 문자열이면 에러를 반환한다', () => {
            const errors = validateCalendarData({ googleCalendarId: '' });

            expect(errors.googleCalendarId).toBe('Google Calendar ID를 입력해주세요.');
        });

        it('googleCalendarId가 유효하지 않은 형식이면 에러를 반환한다', () => {
            const errors = validateCalendarData({ googleCalendarId: 'invalid-id' });

            expect(errors.googleCalendarId).toBe(
                'Google Calendar ID 형식이 올바르지 않습니다. (예: user@gmail.com)',
            );
        });

        it('googleCalendarId가 유효한 이메일 형식이면 에러가 없다', () => {
            const errors = validateCalendarData({ googleCalendarId: 'user@gmail.com' });

            expect(errors.googleCalendarId).toBeUndefined();
        });

        it('googleCalendarId가 undefined면 검증하지 않는다', () => {
            const errors = validateCalendarData({});

            expect(errors.googleCalendarId).toBeUndefined();
        });
    });

    describe('복합 검증', () => {
        it('여러 필드에서 에러가 발생할 수 있다', () => {
            const errors = validateCalendarData({
                topics: [],
                description: '짧음',
                googleCalendarId: 'invalid',
            });

            expect(errors.topics).toBeDefined();
            expect(errors.description).toBeDefined();
            expect(errors.googleCalendarId).toBeDefined();
        });

        it('모든 필드가 유효하면 빈 객체를 반환한다', () => {
            const errors = validateCalendarData({
                topics: ['주제1', '주제2'],
                description: '충분히 긴 설명입니다.',
                googleCalendarId: 'user@gmail.com',
            });

            expect(Object.keys(errors)).toHaveLength(0);
        });
    });
});

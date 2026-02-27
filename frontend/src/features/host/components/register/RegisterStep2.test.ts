import { describe, expect, it } from 'vitest';
import { CALENDAR_ID_REGEX } from './RegisterStep2';

describe('CALENDAR_ID_REGEX', () => {
    describe('유효한 Calendar ID', () => {
        it('개인 캘린더 ID (gmail.com)', () => {
            expect(CALENDAR_ID_REGEX.test('user@gmail.com')).toBe(true);
            expect(CALENDAR_ID_REGEX.test('test.user@gmail.com')).toBe(true);
            expect(CALENDAR_ID_REGEX.test('test+label@gmail.com')).toBe(true);
        });

        it('그룹 캘린더 ID (group.calendar.google.com)', () => {
            expect(CALENDAR_ID_REGEX.test('abc123@group.calendar.google.com')).toBe(true);
            expect(CALENDAR_ID_REGEX.test('my-calendar@group.calendar.google.com')).toBe(true);
            expect(CALENDAR_ID_REGEX.test('test_cal.123@group.calendar.google.com')).toBe(true);
        });

        it('다른 이메일 도메인', () => {
            expect(CALENDAR_ID_REGEX.test('user@company.com')).toBe(true);
            expect(CALENDAR_ID_REGEX.test('user@sub.domain.co.kr')).toBe(true);
            expect(CALENDAR_ID_REGEX.test('user@mail.example.org')).toBe(true);
        });
    });

    describe('유효하지 않은 Calendar ID', () => {
        it('@가 없는 경우', () => {
            expect(CALENDAR_ID_REGEX.test('invalid-calendar-id')).toBe(false);
        });

        it('도메인이 없는 경우', () => {
            expect(CALENDAR_ID_REGEX.test('user@')).toBe(false);
        });

        it('로컬 파트가 없는 경우', () => {
            expect(CALENDAR_ID_REGEX.test('@gmail.com')).toBe(false);
        });

        it('TLD가 없는 경우', () => {
            expect(CALENDAR_ID_REGEX.test('user@domain')).toBe(false);
        });

        it('빈 문자열', () => {
            expect(CALENDAR_ID_REGEX.test('')).toBe(false);
        });

        it('공백이 포함된 경우', () => {
            expect(CALENDAR_ID_REGEX.test('user name@gmail.com')).toBe(false);
            expect(CALENDAR_ID_REGEX.test('user@gmail .com')).toBe(false);
        });
    });
});

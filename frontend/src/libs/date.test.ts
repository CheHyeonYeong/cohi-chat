import { describe, it, expect } from 'vitest';
import { parseDateTime, extractTime, formatDateToISO, formatKoreanDate, formatKoreanTime } from './date';

describe('date utils', () => {
    describe('parseDateTime', () => {
        it('ISO 8601 문자열을 Date 객체로 변환한다', () => {
            const result = parseDateTime('2024-03-15T10:30:00');
            expect(result).toBeInstanceOf(Date);
            expect(result.getFullYear()).toBe(2024);
            expect(result.getMonth()).toBe(2); // 0-based
            expect(result.getDate()).toBe(15);
        });
    });

    describe('extractTime', () => {
        it('ISO 문자열에서 시간을 H:mm 형식으로 추출한다', () => {
            expect(extractTime('2024-03-15T09:05:00')).toBe('9:05');
        });

        it('오후 시간도 올바르게 추출한다', () => {
            expect(extractTime('2024-03-15T14:30:00')).toBe('14:30');
        });
    });

    describe('formatDateToISO', () => {
        it('Date를 YYYY-MM-DD 형식으로 변환한다', () => {
            const date = new Date(2024, 2, 15); // March 15, 2024
            expect(formatDateToISO(date)).toBe('2024-03-15');
        });

        it('한 자리 월/일도 zero-pad 한다', () => {
            const date = new Date(2024, 0, 5); // January 5, 2024
            expect(formatDateToISO(date)).toBe('2024-01-05');
        });
    });

    describe('formatKoreanDate', () => {
        it('Date를 한국어 날짜 형식으로 변환한다', () => {
            const date = new Date(2024, 2, 15);
            expect(formatKoreanDate(date)).toBe('2024년 3월 15일');
        });
    });

    describe('formatKoreanTime', () => {
        it('Date를 HH:mm 형식으로 변환한다', () => {
            const date = new Date(2024, 2, 15, 9, 5);
            expect(formatKoreanTime(date)).toBe('09:05');
        });
    });
});

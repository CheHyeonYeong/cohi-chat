import { describe, it, expect } from 'vitest';
import { getDaysInMonth, getCalendarDays } from './getCalendarDays';

describe('getDaysInMonth', () => {
    it('1월은 31일이다', () => {
        const date = new Date(2024, 0, 1);
        expect(getDaysInMonth(date)).toBe(31);
    });

    it('2월 평년은 28일이다', () => {
        const date = new Date(2023, 1, 1);
        expect(getDaysInMonth(date)).toBe(28);
    });

    it('2월 윤년은 29일이다', () => {
        const date = new Date(2024, 1, 1);
        expect(getDaysInMonth(date)).toBe(29);
    });

    it('4월은 30일이다', () => {
        const date = new Date(2024, 3, 1);
        expect(getDaysInMonth(date)).toBe(30);
    });

    it('6월은 30일이다', () => {
        const date = new Date(2024, 5, 1);
        expect(getDaysInMonth(date)).toBe(30);
    });

    it('12월은 31일이다', () => {
        const date = new Date(2024, 11, 1);
        expect(getDaysInMonth(date)).toBe(31);
    });
});

describe('getCalendarDays', () => {
    it('첫 번째 날의 요일에 맞게 앞쪽에 0으로 패딩한다', () => {
        const date = new Date(2024, 5, 1);
        const days = getCalendarDays(date);

        const startOfJune2024 = new Date(2024, 5, 1).getDay();
        const padding = days.slice(0, startOfJune2024);
        expect(padding.every((d) => d === 0)).toBe(true);
    });

    it('해당 월의 모든 날짜를 포함한다', () => {
        const date = new Date(2024, 5, 1);
        const days = getCalendarDays(date);

        for (let day = 1; day <= 30; day++) {
            expect(days).toContain(day);
        }
    });

    it('결과 배열의 길이는 7의 배수이다', () => {
        const date = new Date(2024, 5, 1);
        const days = getCalendarDays(date);

        expect(days.length % 7).toBe(0);
    });

    it('2024년 1월 달력은 첫 번째 날이 월요일이므로 1개의 0으로 시작한다', () => {
        const date = new Date(2024, 0, 1);
        const days = getCalendarDays(date);

        expect(days[0]).toBe(0);
        expect(days[1]).toBe(1);
    });

    it('2024년 9월 달력은 첫 번째 날이 일요일이므로 0으로 시작하지 않는다', () => {
        const date = new Date(2024, 8, 1);
        const days = getCalendarDays(date);

        expect(days[0]).toBe(1);
    });
});

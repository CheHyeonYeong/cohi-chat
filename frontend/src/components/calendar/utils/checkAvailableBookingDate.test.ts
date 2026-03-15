import { describe, it, expect } from 'vitest';
import { checkAvailableBookingDate, isTimeslotAvailableOnDate } from './checkAvailableBookingDate';
import type { ITimeSlot, IBooking } from '../types';

const createTimeslot = (
    weekdays: number[],
    startDate: string | null = null,
    endDate: string | null = null,
): ITimeSlot => ({
    id: 1,
    userId: 'test-user',
    startedAt: '10:00',
    endedAt: '11:00',
    weekdays,
    startDate,
    endDate,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
});

describe('isTimeslotAvailableOnDate', () => {
    describe('요일 체크', () => {
        it('타임슬롯에 해당 요일이 포함되어 있으면 true를 반환한다', () => {
            const timeslot = createTimeslot([1, 3, 5]);
            expect(isTimeslotAvailableOnDate(timeslot, 2024, 6, 10, 1)).toBe(true);
        });

        it('타임슬롯에 해당 요일이 포함되어 있지 않으면 false를 반환한다', () => {
            const timeslot = createTimeslot([1, 3, 5]);
            expect(isTimeslotAvailableOnDate(timeslot, 2024, 6, 11, 2)).toBe(false);
        });
    });

    describe('날짜 범위 체크', () => {
        it('startDate 이전 날짜면 false를 반환한다', () => {
            const timeslot = createTimeslot([0, 1, 2, 3, 4, 5, 6], '2024-06-15', null);
            expect(isTimeslotAvailableOnDate(timeslot, 2024, 6, 10, 1)).toBe(false);
        });

        it('endDate 이후 날짜면 false를 반환한다', () => {
            const timeslot = createTimeslot([0, 1, 2, 3, 4, 5, 6], null, '2024-06-15');
            expect(isTimeslotAvailableOnDate(timeslot, 2024, 6, 20, 4)).toBe(false);
        });

        it('날짜 범위 내라면 true를 반환한다', () => {
            const timeslot = createTimeslot([0, 1, 2, 3, 4, 5, 6], '2024-06-10', '2024-06-20');
            expect(isTimeslotAvailableOnDate(timeslot, 2024, 6, 15, 6)).toBe(true);
        });

        it('시작일과 종료일이 없으면 요일만 체크한다', () => {
            const timeslot = createTimeslot([1, 3, 5]);
            expect(isTimeslotAvailableOnDate(timeslot, 2024, 6, 10, 1)).toBe(true);
        });
    });
});

describe('checkAvailableBookingDate', () => {
    const baseDate = new Date(2024, 5, 10);

    describe('과거 날짜 체크', () => {
        it('지난 연도의 날짜는 false를 반환한다', () => {
            const timeslots = [createTimeslot([0, 1, 2, 3, 4, 5, 6])];
            expect(checkAvailableBookingDate(baseDate, timeslots, [], 2023, 6, 15, 1)).toBe(false);
        });

        it('같은 연도 지난 월의 날짜는 false를 반환한다', () => {
            const timeslots = [createTimeslot([0, 1, 2, 3, 4, 5, 6])];
            expect(checkAvailableBookingDate(baseDate, timeslots, [], 2024, 5, 15, 3)).toBe(false);
        });

        it('같은 월 지난 일의 날짜는 false를 반환한다', () => {
            const timeslots = [createTimeslot([0, 1, 2, 3, 4, 5, 6])];
            expect(checkAvailableBookingDate(baseDate, timeslots, [], 2024, 6, 5, 3)).toBe(false);
        });
    });

    describe('타임슬롯 체크', () => {
        it('타임슬롯이 없으면 false를 반환한다', () => {
            expect(checkAvailableBookingDate(baseDate, [], [], 2024, 6, 15, 6)).toBe(false);
        });

        it('해당 요일에 이용 가능한 타임슬롯이 없으면 false를 반환한다', () => {
            const timeslots = [createTimeslot([1, 3, 5])];
            expect(checkAvailableBookingDate(baseDate, timeslots, [], 2024, 6, 16, 0)).toBe(false);
        });

        it('day가 0이면 false를 반환한다', () => {
            const timeslots = [createTimeslot([0, 1, 2, 3, 4, 5, 6])];
            expect(checkAvailableBookingDate(baseDate, timeslots, [], 2024, 6, 0, 0)).toBe(false);
        });
    });

    describe('예약 충돌 체크', () => {
        it('해당 날짜에 같은 시간대 예약이 있으면 false를 반환한다', () => {
            const timeslots: ITimeSlot[] = [
                {
                    id: 1,
                    userId: 'test-user',
                    startedAt: '10:00',
                    endedAt: '11:00',
                    weekdays: [0, 1, 2, 3, 4, 5, 6],
                    startDate: null,
                    endDate: null,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                },
            ];

            const bookings: IBooking[] = [
                {
                    id: 1,
                    startedAt: '2024-06-15T10:00:00',
                    endedAt: '2024-06-15T11:00:00',
                },
            ];

            expect(checkAvailableBookingDate(baseDate, timeslots, bookings, 2024, 6, 15, 6)).toBe(
                false,
            );
        });

        it('해당 날짜에 다른 시간대 예약은 영향을 주지 않는다', () => {
            const timeslots: ITimeSlot[] = [
                {
                    id: 1,
                    userId: 'test-user',
                    startedAt: '10:00',
                    endedAt: '11:00',
                    weekdays: [0, 1, 2, 3, 4, 5, 6],
                    startDate: null,
                    endDate: null,
                    createdAt: '2024-01-01T00:00:00Z',
                    updatedAt: '2024-01-01T00:00:00Z',
                },
            ];

            const bookings: IBooking[] = [
                {
                    id: 1,
                    startedAt: '2024-06-15T14:00:00',
                    endedAt: '2024-06-15T15:00:00',
                },
            ];

            expect(checkAvailableBookingDate(baseDate, timeslots, bookings, 2024, 6, 15, 6)).toBe(
                true,
            );
        });

        it('다른 날짜의 예약은 영향을 주지 않는다', () => {
            const timeslots = [createTimeslot([0, 1, 2, 3, 4, 5, 6])];
            const bookings: IBooking[] = [
                {
                    id: 1,
                    startedAt: '2024-06-16T10:00:00',
                    endedAt: '2024-06-16T11:00:00',
                },
            ];

            expect(checkAvailableBookingDate(baseDate, timeslots, bookings, 2024, 6, 15, 6)).toBe(
                true,
            );
        });
    });

    describe('정상 케이스', () => {
        it('모든 조건을 만족하면 true를 반환한다', () => {
            const timeslots = [createTimeslot([0, 1, 2, 3, 4, 5, 6])];
            expect(checkAvailableBookingDate(baseDate, timeslots, [], 2024, 6, 15, 6)).toBe(true);
        });
    });
});

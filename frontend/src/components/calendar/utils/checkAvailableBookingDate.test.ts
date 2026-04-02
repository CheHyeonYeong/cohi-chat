import { describe, expect, it } from 'vitest';

import { checkAvailableBookingDate, isTimeslotAvailableOnDate, isTimeslotBookedOnDate } from './checkAvailableBookingDate';
import type { IBooking, ITimeSlot } from '../types';

const timeslot: ITimeSlot = {
    id: 1,
    userId: 'host-1',
    startedAt: '10:00',
    endedAt: '11:00',
    weekdays: [1],
    startDate: null,
    endDate: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
};

const booking: IBooking = {
    id: 1,
    timeSlotId: 1,
    startedAt: '2025-03-17T10:00:00+09:00',
    endedAt: '2025-03-17T11:00:00+09:00',
};

describe('checkAvailableBookingDate', () => {
    it('날짜에 타임슬롯이 있으면 예약이 있어도 날짜는 선택 가능하다', () => {
        const result = checkAvailableBookingDate(new Date('2025-03-01T00:00:00+09:00'), [timeslot], [booking], 2025, 3, 17, 1);

        expect(result).toBe(true);
    });
    it('same time with a different timeslot id stays available', () => {
        const replacedTimeslot = { ...timeslot, id: 99 };

        expect(isTimeslotBookedOnDate(replacedTimeslot, [booking], 2025, 3, 17)).toBe(false);
    });
});

describe('isTimeslotAvailableOnDate', () => {
    it('요일과 기간이 맞으면 타임슬롯이 열린다', () => {
        expect(isTimeslotAvailableOnDate(timeslot, 2025, 3, 17, 1)).toBe(true);
    });
});

describe('isTimeslotBookedOnDate', () => {
    it('같은 날짜에 시간이 겹치면 예약된 슬롯으로 본다', () => {
        expect(isTimeslotBookedOnDate(timeslot, [booking], 2025, 3, 17)).toBe(true);
    });

    it('같은 날짜라도 시간이 안 겹치면 예약 가능한 슬롯으로 본다', () => {
        const shiftedTimeslot = { ...timeslot, id: 2, startedAt: '11:00', endedAt: '12:00' };

        expect(isTimeslotBookedOnDate(shiftedTimeslot, [booking], 2025, 3, 17)).toBe(false);
    });
});

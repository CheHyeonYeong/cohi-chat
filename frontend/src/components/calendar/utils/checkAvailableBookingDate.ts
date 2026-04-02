import type { IBooking, ICalendarEvent, ITimeSlot } from '../types';

export const isTimeslotAvailableOnDate = (
    timeslot: ITimeSlot,
    year: number,
    month: number,
    day: number,
    weekday: number
): boolean => {
    if (!timeslot.weekdays.includes(weekday)) return false;
    const { startDate, endDate } = timeslot;
    if (startDate || endDate) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (startDate && dateStr < startDate) return false;
        if (endDate && dateStr > endDate) return false;
    }
    return true;
};

const isBookingOnDate = (
    booking: IBooking | ICalendarEvent,
    year: number,
    month: number,
    day: number
): boolean => {
    const bookingStart = new Date(booking.startedAt);
    return bookingStart.getFullYear() === year
        && bookingStart.getMonth() + 1 === month
        && bookingStart.getDate() === day;
};

const parseTimeToMinutes = (time: string): number => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export const isTimeslotBookedOnDate = (
    timeslot: ITimeSlot,
    bookings: Array<IBooking | ICalendarEvent>,
    year: number,
    month: number,
    day: number
): boolean => {
    return bookings.some((booking) => {
        if (!isBookingOnDate(booking, year, month, day)) {
            return false;
        }

        if ('timeSlotId' in booking && typeof booking.timeSlotId === 'number') {
            return booking.timeSlotId === timeslot.id;
        }

        const startTime = parseTimeToMinutes(timeslot.startedAt);
        const endTime = parseTimeToMinutes(timeslot.endedAt);
        const bookingStart = new Date(booking.startedAt);
        const bookingEnd = new Date(booking.endedAt);
        const bookingStartTime = bookingStart.getHours() * 60 + bookingStart.getMinutes();
        const bookingEndTime = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();

        return bookingStartTime < endTime && bookingEndTime > startTime;
    });
};

export const checkAvailableBookingDate = (
    baseDate: Date,
    timeslots: ITimeSlot[],
    _bookings: Array<IBooking | ICalendarEvent>,
    year: number,
    month: number,
    day: number,
    weekday: number
): boolean => {
    const isUnavailable =
        (year < baseDate.getFullYear() ||
            (year === baseDate.getFullYear() && month < baseDate.getMonth() + 1)) ||
        (year === baseDate.getFullYear() &&
            month === baseDate.getMonth() + 1 &&
            day < baseDate.getDate());

    if (isUnavailable) {
        return false;
    }

    if (timeslots.length === 0) {
        return false;
    }

    if (day === 0) {
        return false;
    }

    return timeslots.some((timeslot) => isTimeslotAvailableOnDate(timeslot, year, month, day, weekday));
};

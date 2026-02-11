import type { IBooking, ICalendarEvent, ITimeSlot } from '../types';

export function isTimeslotAvailableOnDate(
    timeslot: ITimeSlot,
    year: number,
    month: number,
    day: number,
    weekday: number
): boolean {
    if (!timeslot.weekdays.includes(weekday)) return false;
    const { startDate, endDate } = timeslot;
    if (startDate || endDate) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (startDate && dateStr < startDate) return false;
        if (endDate && dateStr > endDate) return false;
    }
    return true;
}

export function checkAvailableBookingDate(
    baseDate: Date,
    timeslots: ITimeSlot[],
    bookings: Array<IBooking | ICalendarEvent>,
    year: number,
    month: number,
    day: number,
    weekday: number
): boolean {
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

    const hasAvailableTimeslot = timeslots.some(timeslot => isTimeslotAvailableOnDate(timeslot, year, month, day, weekday));
    if (!hasAvailableTimeslot) return false;

    return !bookings.some((booking) => {
        const [bookingYear, bookingMonth, bookingDay] = booking.when.split("-");
        if (Number(bookingYear) !== year || Number(bookingMonth) !== month || Number(bookingDay) !== day) {
            return false;
        }

        const [bookingStartHour, bookingStartMinute] = booking.timeSlot.startTime.split(":");
        const bookingStartTime = Number(bookingStartHour) * 60 + Number(bookingStartMinute);
        const [bookingEndHour, bookingEndMinute] = booking.timeSlot.endTime.split(":");
        const bookingEndTime = Number(bookingEndHour) * 60 + Number(bookingEndMinute);

        return timeslots.some((timeslot) => {
            const [startHour, startMinute] = timeslot.startTime.split(":");
            const startTime = Number(startHour) * 60 + Number(startMinute);
            const [endHour, endMinute] = timeslot.endTime.split(":");
            const endTime = Number(endHour) * 60 + Number(endMinute);

            return (bookingEndTime >= startTime && bookingEndTime <= endTime)
                || (bookingStartTime >= startTime && bookingStartTime <= endTime)
                || (startTime <= bookingStartTime && bookingEndTime <= endTime)
                || (bookingStartTime <= startTime && bookingEndTime >= endTime);
        });
    });
}

import type { IBooking, ICalendarEvent, ITimeSlot } from '../types';

export const isTimeslotAvailableOnDate = (timeslot: ITimeSlot, year: number, month: number, day: number, weekday: number): boolean => {
    if (!timeslot.weekdays.includes(weekday)) return false;
    const { startDate, endDate } = timeslot;
    if (startDate || endDate) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (startDate && dateStr < startDate) return false;
        if (endDate && dateStr > endDate) return false;
    }
    return true;
};

export const isTimeslotBooked = (timeslot: ITimeSlot, bookings: Array<IBooking | ICalendarEvent>, year: number, month: number, day: number): boolean => {
    const [startHour, startMinute] = timeslot.startedAt.split(":");
    const startTime = Number(startHour) * 60 + Number(startMinute);
    const [endHour, endMinute] = timeslot.endedAt.split(":");
    const endTime = Number(endHour) * 60 + Number(endMinute);

    return bookings.some((booking) => {
        const bookingStart = new Date(booking.startedAt);
        if (bookingStart.getFullYear() !== year || bookingStart.getMonth() + 1 !== month || bookingStart.getDate() !== day) {
            return false;
        }
        const bookingStartTime = bookingStart.getHours() * 60 + bookingStart.getMinutes();
        const bookingEnd = new Date(booking.endedAt);
        const bookingEndTime = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();
        return bookingStartTime < endTime && bookingEndTime > startTime;
    });
};

export const checkAvailableBookingDate = (baseDate: Date, timeslots: ITimeSlot[], bookings: Array<IBooking | ICalendarEvent>, year: number, month: number, day: number, weekday: number): boolean => {
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

    // day === 0은 달력 그리드의 빈 셀 (getCalendarDays에서 패딩으로 채운 값)
    if (day === 0) {
        return false;
    }

    const hasAvailableTimeslot = timeslots.some(timeslot => isTimeslotAvailableOnDate(timeslot, year, month, day, weekday));
    if (!hasAvailableTimeslot) return false;

    return !bookings.some((booking) => {
        const bookingStart = new Date(booking.startedAt);
        const bookingYear = bookingStart.getFullYear();
        const bookingMonth = bookingStart.getMonth() + 1;
        const bookingDay = bookingStart.getDate();
        if (bookingYear !== year || bookingMonth !== month || bookingDay !== day) {
            return false;
        }

        const bookingStartTime = bookingStart.getHours() * 60 + bookingStart.getMinutes();
        const bookingEnd = new Date(booking.endedAt);
        const bookingEndTime = bookingEnd.getHours() * 60 + bookingEnd.getMinutes();

        return timeslots.some((timeslot) => {
            const [startHour, startMinute] = timeslot.startedAt.split(":");
            const startTime = Number(startHour) * 60 + Number(startMinute);
            const [endHour, endMinute] = timeslot.endedAt.split(":");
            const endTime = Number(endHour) * 60 + Number(endMinute);

            return bookingStartTime < endTime && bookingEndTime > startTime;
        });
    });
};

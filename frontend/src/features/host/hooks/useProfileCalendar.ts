import { useState, useRef } from 'react';
import type { ITimeSlot, IBooking } from '~/components/calendar';

const isMobile = () => window.innerWidth < 768;

interface UseProfileCalendarOptions {
    onDateChange?: () => void;
}

export type ProfileCalendarState = ReturnType<typeof useProfileCalendar>;

export const useProfileCalendar = ({ onDateChange }: UseProfileCalendarOptions = {}) => {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTimeslot, setSelectedTimeslot] = useState<ITimeSlot | null>(null);

    const timeslotsRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLDivElement>(null);

    const handlePrevMonth = (_slug: string, date: { year: number; month: number }) => {
        setYear(date.year);
        setMonth(date.month);
    };

    const handleNextMonth = (_slug: string, date: { year: number; month: number }) => {
        setYear(date.year);
        setMonth(date.month);
    };

    const handleSelectDay = (date: Date) => {
        setSelectedDate(date);
        setSelectedTimeslot(null);
        onDateChange?.();
        if (isMobile()) {
            setTimeout(() => timeslotsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const handleSelectTimeslot = (timeslot: ITimeSlot) => {
        setSelectedTimeslot(timeslot);
        if (isMobile()) {
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const resetSelection = () => {
        setSelectedTimeslot(null);
        setSelectedDate(null);
    };

    return {
        year,
        month,
        selectedDate,
        selectedTimeslot,
        timeslotsRef,
        formRef,
        handlePrevMonth,
        handleNextMonth,
        handleSelectDay,
        handleSelectTimeslot,
        resetSelection,
    };
};

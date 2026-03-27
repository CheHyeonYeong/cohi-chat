import { useState, useRef } from 'react';
import type { ITimeSlot } from '~/components/calendar';
import { parseDateTime } from '~/libs/date';

const isMobile = () => window.innerWidth < 768;

interface UseProfileCalendarOptions {
    initialDate?: string;
    onDateChange?: (date: Date | null) => void;
}

export type ProfileCalendarState = ReturnType<typeof useProfileCalendar>;

export const useProfileCalendar = ({ initialDate, onDateChange }: UseProfileCalendarOptions = {}) => {
    const parsedInitial = initialDate ? parseDateTime(initialDate) : null;
    const isValidInitial = parsedInitial !== null && !Number.isNaN(parsedInitial.getTime());
    const now = isValidInitial ? parsedInitial : new Date();

    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState<Date | null>(isValidInitial ? parsedInitial : null);
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
        const isSameDate = selectedDate
            && selectedDate.getFullYear() === date.getFullYear()
            && selectedDate.getMonth() === date.getMonth()
            && selectedDate.getDate() === date.getDate();

        if (isSameDate) {
            setSelectedDate(null);
            setSelectedTimeslot(null);
            onDateChange?.(null);
            return;
        }

        setSelectedDate(date);
        setSelectedTimeslot(null);
        onDateChange?.(date);
        if (isMobile()) {
            setTimeout(() => timeslotsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const handleSelectTimeslot = (timeslot: ITimeSlot) => {
        if (selectedTimeslot?.id === timeslot.id) {
            setSelectedTimeslot(null);
            return;
        }
        setSelectedTimeslot(timeslot);
        if (isMobile()) {
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const resetSelection = () => {
        setSelectedTimeslot(null);
        setSelectedDate(null);
        onDateChange?.(null);
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

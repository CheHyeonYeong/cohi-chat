import { cn } from "~/libs/cn";
import { checkAvailableBookingDate } from "../utils";
import type { IBooking, ICalendarEvent, ITimeSlot } from "../types";

interface BodyProps {
    year: number;
    month: number;
    days: number[];
    baseDate?: Date;
    timeslots: ITimeSlot[];
    bookings: Array<IBooking | ICalendarEvent>;
    onSelectDay: (date: Date) => void;
}

export function Body({ year, month, days, baseDate, timeslots, bookings, onSelectDay }: BodyProps) {
    const weeks = days.reduce<number[][]>((acc, day, i) => {
        const weekIndex = Math.floor(i / 7);

        if (!acc[weekIndex]) {
            acc[weekIndex] = [];
        }

        acc[weekIndex].push(day);
        return acc;
    }, []);

    const now = baseDate ?? new Date();

    return (
        <div className="w-full">
            <div className="grid grid-cols-7 text-lg font-semibold border-b pb-2 mb-2">
                <div className="text-center text-red-500">일</div>
                <div className="text-center">월</div>
                <div className="text-center">화</div>
                <div className="text-center">수</div>
                <div className="text-center">목</div>
                <div className="text-center">금</div>
                <div className="text-center text-blue-500">토</div>
            </div>

            <div role="grid" aria-label="calendar-body">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7">
                        {week.map((day, dayIndex) => {
                            const weekday = dayIndex;
                            const isAvailable = checkAvailableBookingDate(now, timeslots, bookings, year, month, day, weekday);

                            return (
                                <div
                                    role={day !== 0 ? "button" : undefined}
                                    aria-label={day !== 0 ? `day-${day}` : undefined}
                                    key={dayIndex}
                                    className="flex justify-center items-center py-1"
                                >
                                    <span
                                        className={cn(
                                            "booking-cell flex justify-center items-center rounded-full aspect-square w-10 sm:w-12 select-none text-sm sm:text-base",
                                            { 'text-[#AAAAAA] bg-inherit hover:cursor-default': !isAvailable },
                                            { 'font-bold text-primary bg-blue-50': isAvailable },
                                            { 'cursor-pointer hover:bg-primary hover:text-white': isAvailable },
                                        )}
                                        onClick={() => isAvailable ? onSelectDay(new Date(year, month - 1, day)) : undefined}
                                    >
                                        {day !== 0 && day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

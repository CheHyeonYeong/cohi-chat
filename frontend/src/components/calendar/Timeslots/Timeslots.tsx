import { Suspense } from 'react';
import { Link } from "@tanstack/react-router";
import dayjs from 'dayjs';

import { Button } from "~/components/button";
import { formatKoreanDate } from '~/libs/date';
import { useAuth } from "~/features/member";
import { checkAvailableBookingDate, isTimeslotAvailableOnDate } from "../utils";
import type { IBooking, ICalendarEvent, ITimeSlot } from "../types";

interface TimeslotsProps {
    baseDate: Date;
    timeslots: ITimeSlot[];
    bookings: Array<IBooking | ICalendarEvent>;
    selectedTimeslotId?: number;
    onSelectTimeslot: (timeslot: ITimeSlot) => void;
}

export const Timeslots = ({ baseDate, timeslots, bookings, selectedTimeslotId, onSelectTimeslot }: TimeslotsProps) => {
    const { isAuthenticated } = useAuth();

    const date = dayjs(baseDate);
    const year = date.year();
    const month = date.month() + 1;
    const day = date.date();
    const weekday = date.day();

    const isAvailable = checkAvailableBookingDate(date.toDate(), timeslots, bookings, year, month, day, weekday);
    const availableTimeslots = timeslots
        .filter((ts) => isTimeslotAvailableOnDate(ts, year, month, day, weekday))
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

    return <Suspense fallback={<div>Loading timeslots...</div>}>
        <div className="flex flex-col gap-4 items-center justify-start mx-auto">
            <h3 className="text-2xl font-bold">{formatKoreanDate(date.toDate())}</h3>
            {!isAuthenticated && (
                <div
                    role="status"
                    role-label="no-date"
                    className="space-y-3 md:space-y-4 w-full text-center md:text-left">
                    <Link
                        to="/login"
                        className="block w-full font-semibold rounded-md py-3 text-center cohi-btn-primary">
                        로그인 후 커피챗 신청하기
                    </Link>
                </div>
            )}

            {isAuthenticated && (timeslots.length === 0 || !isAvailable) && (<div role="status" role-label="no-timeslots">
                <p>예약 가능한 시간대가 없는 날입니다.</p>
            </div>
            )}

            {isAuthenticated && isAvailable && availableTimeslots.map((timeslot) => (
                <Button
                    variant="selectable"
                    selected={selectedTimeslotId === timeslot.id}
                    type="button"
                    role="button"
                    role-label={`timeslot-${timeslot.id}`}
                    key={`${timeslot.startedAt}-${timeslot.endedAt}`}
                    className="w-full h-fit"
                    onClick={() => onSelectTimeslot(timeslot)}
                >
                    <span role="time">{timeslot.startedAt}</span>
                </Button>
            ))}
        </div>
    </Suspense>
};

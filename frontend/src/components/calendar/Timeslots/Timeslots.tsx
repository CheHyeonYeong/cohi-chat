import { Suspense } from 'react';
import { Link } from '@tanstack/react-router';

import { Button } from '~/components/button';
import { useAuth } from '~/features/member';
import { isTimeslotAvailableOnDate, isTimeslotBookedOnDate } from '../utils';
import type { IBooking, ICalendarEvent, ITimeSlot } from '../types';

interface TimeslotsProps {
    baseDate: Date | null;
    timeslots: ITimeSlot[];
    bookings: Array<IBooking | ICalendarEvent>;
    selectedTimeslotId?: number;
    onSelectTimeslot: (timeslot: ITimeSlot) => void;
}

export const Timeslots = ({ baseDate, timeslots, bookings, selectedTimeslotId, onSelectTimeslot }: TimeslotsProps) => {
    const { isAuthenticated } = useAuth();

    const now = baseDate ?? new Date();
    const weekday = now.getDay();
    const availableTimeslots = timeslots
        .filter((timeslot) => isTimeslotAvailableOnDate(timeslot, now.getFullYear(), now.getMonth() + 1, now.getDate(), weekday))
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

    return (
        <Suspense fallback={<div>Loading timeslots...</div>}>
            <div className="mx-auto flex items-center justify-start gap-4 flex-col">
                <h3 className="text-2xl font-bold">{now.getFullYear()}년 {now.getMonth() + 1}월 {now.getDate()}일</h3>
                {!isAuthenticated && (
                    <div
                        role="status"
                        role-label="no-date"
                        className="w-full space-y-3 text-center md:w-full md:min-w-60 md:w-60 md:space-y-4 md:text-left"
                    >
                        <Link
                            to="/login"
                            className="cohi-btn-primary block w-full rounded-md py-3 text-center font-semibold"
                        >
                            로그인하고 커피챗 요청하기
                        </Link>
                    </div>
                )}

                {isAuthenticated && availableTimeslots.length === 0 && (
                    <div role="status" role-label="no-timeslots">
                        <p>예약 가능한 시간대가 없는 날입니다.</p>
                    </div>
                )}

                {isAuthenticated && availableTimeslots.map((timeslot) => {
                    const isBooked = isTimeslotBookedOnDate(
                        timeslot,
                        bookings,
                        now.getFullYear(),
                        now.getMonth() + 1,
                        now.getDate()
                    );

                    return (
                        <Button
                            variant="selectable"
                            selected={selectedTimeslotId === timeslot.id}
                            type="button"
                            role="button"
                            role-label={`timeslot-${timeslot.id}`}
                            key={timeslot.id}
                            className="flex h-fit w-full items-center justify-between gap-2"
                            disabled={isBooked}
                            onClick={() => onSelectTimeslot(timeslot)}
                        >
                            <span role="time">{timeslot.startedAt}</span>
                            {isBooked && <span className="text-xs">예약 마감</span>}
                        </Button>
                    );
                })}
            </div>
        </Suspense>
    );
};

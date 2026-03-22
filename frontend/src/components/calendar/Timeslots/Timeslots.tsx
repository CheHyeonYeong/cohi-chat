import { Suspense } from 'react';
import { Link } from '@tanstack/react-router';

import { Button } from '~/components/button';
import { useAuth } from '~/features/member';

import type { IBooking, ICalendarEvent, ITimeSlot } from '../types';
import { checkAvailableBookingDate, isTimeslotAvailableOnDate } from '../utils';

interface TimeslotsProps {
    baseDate: Date | null;
    timeslots: ITimeSlot[];
    bookings: Array<IBooking | ICalendarEvent>;
    onSelectTimeslot: (timeslot: ITimeSlot) => void;
}

export function Timeslots({ baseDate, timeslots, bookings, onSelectTimeslot }: TimeslotsProps) {
    const { isAuthenticated, isLoading } = useAuth();

    const now = baseDate ?? new Date();
    const weekday = now.getDay();
    const isAvailable = checkAvailableBookingDate(
        now,
        timeslots,
        bookings,
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
        weekday,
    );
    const availableTimeslots = timeslots
        .filter((timeslot) => (
            isTimeslotAvailableOnDate(
                timeslot,
                now.getFullYear(),
                now.getMonth() + 1,
                now.getDate(),
                weekday,
            )
        ))
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

    return (
        <Suspense fallback={<div>Loading timeslots...</div>}>
            <div className="flex flex-col gap-4 items-center justify-start mx-auto">
                <h3 className="text-2xl font-bold">{`${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`}</h3>

                {isLoading && (
                    <div role="status" aria-label="auth-loading">
                        <p>로그인 상태를 확인하는 중입니다.</p>
                    </div>
                )}

                {!isLoading && !isAuthenticated && (
                    <div
                        role="status"
                        aria-label="unauthenticated"
                        className="space-y-3 md:space-y-4 w-full md:w-60 md:min-w-60 text-center md:w-full md:text-left"
                    >
                        <Link
                            to="/login"
                            className="block w-full font-semibold rounded-md py-3 text-center cohi-btn-primary"
                        >
                            로그인하고 커피챗 요청하기
                        </Link>
                    </div>
                )}

                {!isLoading && isAuthenticated && (timeslots.length === 0 || !isAvailable) && (
                    <div role="status" aria-label="no-timeslots">
                        <p>예약 가능한 시간대가 없습니다.</p>
                    </div>
                )}

                {!isLoading && isAuthenticated && isAvailable && availableTimeslots.map((timeslot) => (
                    <Button
                        key={`${timeslot.startedAt}-${timeslot.endedAt}`}
                        variant="primary"
                        type="button"
                        data-testid={`timeslot-${timeslot.id}`}
                        className="w-full h-fit"
                        onClick={() => onSelectTimeslot(timeslot)}
                    >
                        <span role="time">{timeslot.startedAt}</span>
                    </Button>
                ))}
            </div>
        </Suspense>
    );
}

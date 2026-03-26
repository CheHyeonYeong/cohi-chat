import dayjs from 'dayjs';

import { Button } from '~/components/button';
import { extractTime, formatKoreanDate } from '~/libs/date';
import type { IBooking } from '../types';

interface BookedTimeslotsProps {
    bookings: IBooking[];
    baseDate: Date;
    selectedBookingId?: number;
    onSelectBooking: (bookingId: number) => void;
}

export const BookedTimeslots = ({ bookings, baseDate, selectedBookingId, onSelectBooking }: BookedTimeslotsProps) => {
    const baseDayjs = dayjs(baseDate);
    const dailyBookings = bookings
        .filter((b) => dayjs(b.startedAt).isSame(baseDayjs, 'day'))
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

    return (
        <div className="flex flex-col gap-4 items-center justify-start mx-auto">
            <h3 className="text-2xl font-bold">
                {formatKoreanDate(baseDate)}
            </h3>

            {dailyBookings.length === 0 && (
                <div role="status" data-testid="no-booked-timeslots">
                    <p>예약된 시간이 없는 날입니다.</p>
                </div>
            )}

            {dailyBookings.map((booking) => (
                <Button
                    variant="selectable"
                    selected={selectedBookingId === booking.id}
                    type="button"
                    key={booking.id}
                    className="w-full h-fit"
                    data-testid={`booked-timeslot-${booking.id}`}
                    onClick={() => onSelectBooking(booking.id)}
                >
                    <span role="time">{extractTime(booking.startedAt)}</span>
                </Button>
            ))}
        </div>
    );
};

import { Link } from '@tanstack/react-router';
import { Card } from '~/components/card';
import { Body, Navigator, Timeslots, BookedTimeslots, getCalendarDays } from '~/components/calendar';
import type { ITimeSlot, IBooking } from '~/components/calendar';
import type { ProfileCalendarState } from '../hooks/useProfileCalendar';

interface ProfileCalendarSectionProps {
    isSelf: boolean;
    username: string;
    calendar: ProfileCalendarState;
    timeslots: ITimeSlot[];
    bookings: IBooking[];
    selectedBookingId?: number;
    onSelectBooking: (bookingId: number) => void;
}

export const ProfileCalendarSection = ({
    isSelf,
    username,
    calendar,
    timeslots,
    bookings,
    selectedBookingId,
    onSelectBooking,
}: ProfileCalendarSectionProps) => {
    const calendarTitle = isSelf ? '나에게 예약된 시간' : '예약 가능한 시간';

    return (
        <section data-testid="host-profile-calendar">
            <Card
                variant="elevated"
                title={calendarTitle}
                action={isSelf ? (
                    <Link to="/host/timeslots" className="text-xs font-medium text-cohi-primary hover:underline">
                        시간대 설정
                    </Link>
                ) : undefined}
            >
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 min-w-0">
                        <Navigator
                            slug={username}
                            year={calendar.year}
                            month={calendar.month}
                            onPrevious={calendar.handlePrevMonth}
                            onNext={calendar.handleNextMonth}
                        />
                        <div className="mt-4">
                            <Body
                                year={calendar.year}
                                month={calendar.month}
                                days={getCalendarDays(new Date(calendar.year, calendar.month - 1))}
                                timeslots={timeslots}
                                bookings={bookings}
                                selectedDate={calendar.selectedDate}
                                onSelectDay={calendar.handleSelectDay}
                            />
                        </div>
                    </div>

                    <div ref={calendar.timeslotsRef} className="md:w-[200px] md:min-w-[200px]" data-testid="host-profile-timeslots">
                        {isSelf && calendar.selectedDate ? (
                            <BookedTimeslots
                                bookings={bookings}
                                baseDate={calendar.selectedDate}
                                selectedBookingId={selectedBookingId}
                                onSelectBooking={onSelectBooking}
                            />
                        ) : !isSelf && calendar.selectedDate ? (
                            <Timeslots
                                timeslots={timeslots}
                                bookings={bookings}
                                baseDate={calendar.selectedDate}
                                selectedTimeslotId={calendar.selectedTimeslot?.id}
                                onSelectTimeslot={calendar.handleSelectTimeslot}
                            />
                        ) : (
                            <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-3 py-8">
                                <span className="text-4xl">&#x1F4C5;</span>
                                <p className="text-sm leading-relaxed">
                                    날짜를 선택하면<br />
                                    {isSelf ? '예약된 시간대가' : '예약 가능한 시간대가'}<br />
                                    표시됩니다
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </section>
    );
};

import { useQuery } from '@tanstack/react-query';
import { getBookingsByDate } from '../api/calendar';
import { calendarKeys } from './queryKeys';

interface UseBookingsParams {
    username: string;
    year: number;
    month: number;
}

export const useBookings = ({ username, year, month }: UseBookingsParams) => useQuery({
    queryKey: calendarKeys.bookings(username, year, month),
    queryFn: () => getBookingsByDate(username, { year, month }),
    enabled: !!username && year > 0 && month > 0,
});

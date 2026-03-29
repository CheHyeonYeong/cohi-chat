import { useQuery } from '@tanstack/react-query';
import { getBookingsByDate } from '../api/calendar';
import { calendarKeys } from './queryKeys';

interface UseBookingsParams {
    hostname: string;
    year: number;
    month: number;
}

export const useBookings = ({ hostname, year, month }: UseBookingsParams) => useQuery({
    queryKey: calendarKeys.bookings(hostname, year, month),
    queryFn: () => getBookingsByDate(hostname, { year, month }),
    enabled: !!hostname && year > 0 && month > 0,
});

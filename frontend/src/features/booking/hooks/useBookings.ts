import { useQuery } from '@tanstack/react-query';
import { getBookingsByDate } from '../api/calendar';
import type { IBooking } from '~/components/calendar';
import { calendarKeys } from './queryKeys';

export function useBookings(hostname: string, year: number, month: number) {
    return useQuery<IBooking[]>({
        queryKey: calendarKeys.bookings(year, month),
        queryFn: () => getBookingsByDate(hostname, { year, month }),
        enabled: !!hostname && year > 0 && month > 0,
    });
}

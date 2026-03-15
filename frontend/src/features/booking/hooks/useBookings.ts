import { useQuery } from '@tanstack/react-query';
import { getBookingsByDate } from '../api/calendar';
import type { IBooking } from '~/components/calendar';
import { calendarKeys } from './queryKeys';

export function useBookings(hostname: string, date: Date | null) {
    return useQuery<IBooking[]>({
        queryKey: date ? calendarKeys.bookings(date.getFullYear(), date.getMonth() + 1) : ['bookings'],
        queryFn: () => getBookingsByDate(hostname, { year: date!.getFullYear(), month: date!.getMonth() + 1 }),
        enabled: !!date,
    });
}

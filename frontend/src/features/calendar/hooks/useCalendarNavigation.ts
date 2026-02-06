import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { getBookingsByDate } from '../api';

export function useCalendarNavigation() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const handlePrevious = async (slug: string, date: { year: number; month: number }) => {
        await queryClient.prefetchQuery({
            queryKey: ['bookings', date.year, date.month],
            queryFn: () => getBookingsByDate(slug, { year: date.year, month: date.month }),
        });

        navigate({
            to: '/app/calendar/$slug',
            params: {
                slug,
            },
            search: {
                year: date.year,
                month: date.month,
            },
        });
    };

    const handleNext = async (slug: string, date: { year: number; month: number }) => {
        await queryClient.prefetchQuery({
            queryKey: ['bookings', date.year, date.month],
            queryFn: () => getBookingsByDate(slug, { year: date.year, month: date.month }),
        });

        navigate({
            to: '/app/calendar/$slug',
            params: {
                slug,
            },
            search: {
                year: date.year,
                month: date.month,
            },
        });
    };

    return { handlePrevious, handleNext };
}

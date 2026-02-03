import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getTimeslots } from '../api';

export function useCalendarDateSelection() {
    const queryClient = useQueryClient();

    const handleSelectDay = useCallback(async (slug: string, date: Date) => {
        await queryClient.prefetchQuery({
            queryKey: ['timeslots', slug, date.toISOString()],
            queryFn: () => getTimeslots(slug, date),
        });
    }, [queryClient]);

    return { handleSelectDay };
}

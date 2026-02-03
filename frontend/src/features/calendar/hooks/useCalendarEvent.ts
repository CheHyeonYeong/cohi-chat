import { useQuery } from '@tanstack/react-query';
import { getCalendarEvent } from '../api';
import type { ICalendar } from '../types';

export function useCalendarEvent(slug: string) {
    const { data: event } = useQuery<ICalendar | null>({
        queryKey: ['slug', slug],
        queryFn: () => getCalendarEvent(slug),
    });

    return event ?? null;
}

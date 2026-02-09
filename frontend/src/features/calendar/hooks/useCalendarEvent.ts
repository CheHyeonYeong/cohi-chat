import { useQuery } from '@tanstack/react-query';
import { getCalendarEvent } from '../api';
import type { ICalendar } from '../types';
import { calendarKeys } from './queryKeys';

export function useCalendarEvent(slug: string) {
    const { data: event } = useQuery<ICalendar | null>({
        queryKey: calendarKeys.calendarEvent(slug),
        queryFn: () => getCalendarEvent(slug),
        enabled: !!slug,
    });

    return event ?? null;
}

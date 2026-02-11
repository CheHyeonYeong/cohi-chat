import { useQuery } from '@tanstack/react-query';
import { getMyCalendar } from '../api';
import type { CalendarResponse } from '../types';
import { hostKeys } from './queryKeys';

export function useMyCalendar(enabled = true) {
    return useQuery<CalendarResponse | null>({
        queryKey: hostKeys.myCalendar(),
        queryFn: async () => {
            try {
                return await getMyCalendar();
            } catch (error) {
                if (error instanceof Error && error.cause === 404) {
                    return null;
                }
                throw error;
            }
        },
        enabled,
        retry: false,
    });
}

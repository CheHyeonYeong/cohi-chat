import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCalendar } from '../api';
import type { CalendarCreatePayload, CalendarResponse } from '../types';
import { hostKeys } from './queryKeys';

export function useCreateCalendar() {
    const queryClient = useQueryClient();

    return useMutation<CalendarResponse, Error, CalendarCreatePayload>({
        mutationFn: createCalendar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hostKeys.myCalendar() });
        },
    });
}

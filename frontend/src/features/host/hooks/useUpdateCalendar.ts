import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCalendar } from '../api';
import type { CalendarUpdatePayload, CalendarResponse } from '../types';
import { hostKeys } from './queryKeys';

export function useUpdateCalendar() {
    const queryClient = useQueryClient();

    return useMutation<CalendarResponse, Error, CalendarUpdatePayload>({
        mutationFn: updateCalendar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hostKeys.myCalendar() });
        },
    });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTimeslot } from '../api';
import type { TimeSlotCreatePayload, TimeSlotResponse } from '../types';
import { hostKeys } from './queryKeys';

export function useCreateTimeslot() {
    const queryClient = useQueryClient();

    return useMutation<TimeSlotResponse, Error, TimeSlotCreatePayload>({
        mutationFn: createTimeslot,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hostKeys.myTimeslots() });
        },
    });
}

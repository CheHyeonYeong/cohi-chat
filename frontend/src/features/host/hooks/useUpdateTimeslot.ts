import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTimeslot } from '../api';
import type { TimeSlotCreatePayload, TimeSlotResponse } from '../types';
import { hostKeys } from './queryKeys';

interface UpdateTimeslotVariables {
    id: number;
    payload: TimeSlotCreatePayload;
}

export const useUpdateTimeslot = () => {
    const queryClient = useQueryClient();

    return useMutation<TimeSlotResponse, Error, UpdateTimeslotVariables>({
        mutationFn: ({ id, payload }) => updateTimeslot(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hostKeys.myTimeslots() });
        },
    });
};

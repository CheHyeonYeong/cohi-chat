import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTimeslot } from '../api';
import { hostKeys } from './queryKeys';

export function useDeleteTimeslot() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, number>({
        mutationFn: deleteTimeslot,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: hostKeys.myTimeslots() });
        },
    });
}

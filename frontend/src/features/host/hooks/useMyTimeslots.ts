import { useQuery } from '@tanstack/react-query';
import { getMyTimeslots } from '../api';
import type { TimeSlotResponse } from '../types';
import { hostKeys } from './queryKeys';

export function useMyTimeslots() {
    return useQuery<TimeSlotResponse[]>({
        queryKey: hostKeys.myTimeslots(),
        queryFn: getMyTimeslots,
        retry: false,
    });
}

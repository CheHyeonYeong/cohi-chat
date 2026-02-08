import { useQuery } from '@tanstack/react-query';
import { useHost } from '~/hooks/useHost';
import { getTimeslotsByHostId } from '../api';
import type { ITimeSlot } from '../types';
import { calendarKeys } from './queryKeys';

export function useTimeslots(hostname: string) {
    const { data: host } = useHost(hostname);

    return useQuery<ITimeSlot[]>({
        queryKey: calendarKeys.timeslots(hostname, host?.id),
        queryFn: () => getTimeslotsByHostId(host!.id),
        enabled: !!host?.id,
    });
}

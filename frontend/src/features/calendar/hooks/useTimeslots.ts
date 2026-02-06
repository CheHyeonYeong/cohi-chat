import { useQuery } from '@tanstack/react-query';
import { useHost } from '~/hooks/useHost';
import { getTimeslotsByHostId } from '../api';
import type { ITimeSlot } from '../types';

export function useTimeslots(hostname: string) {
    const { data: host } = useHost(hostname);

    return useQuery<ITimeSlot[]>({
        queryKey: ['timeslots', hostname, host?.id],
        queryFn: () => getTimeslotsByHostId(host!.id),
        enabled: !!host?.id,
    });
}

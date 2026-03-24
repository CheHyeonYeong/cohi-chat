import { useQuery } from '@tanstack/react-query';
import { useHost } from '~/hooks/useHost';
import { getTimeslotsByHostId } from '../api/calendar';
import type { ITimeSlot } from '~/components/calendar';
import { calendarKeys } from './queryKeys';

export const useTimeslots = (hostname: string) => {
    const { data: host } = useHost(hostname);

    return useQuery<ITimeSlot[]>({
        queryKey: calendarKeys.timeslots(hostname, host?.id),
        queryFn: () => getTimeslotsByHostId(host!.id),
        enabled: !!host?.id,
    });
};

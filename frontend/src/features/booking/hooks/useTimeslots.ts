import { useQuery } from '@tanstack/react-query';
import { useHost } from '~/hooks/useHost';
import { getTimeslotsByHostId } from '../api/calendar';
import type { ITimeSlot } from '~/components/calendar';
import { calendarKeys } from './queryKeys';

export const useTimeslots = (username: string) => {
    const { data: host } = useHost(username);

    return useQuery<ITimeSlot[]>({
        queryKey: calendarKeys.timeslots(username, host?.id),
        queryFn: () => getTimeslotsByHostId(host!.id),
        enabled: !!host?.id,
    });
};

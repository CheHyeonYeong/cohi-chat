import { useQuery } from '@tanstack/react-query';
import { getCalendarEvent, getTimeslotsByHostId } from '~/features/booking';
import type { HostResponseDTO } from '~/features/member';
import type { ICalendar, ITimeSlot } from '~/components/calendar';
import { getHosts } from '../api';
import { hostKeys } from './queryKeys';

export const useHostProfile = (username: string) => useQuery<HostResponseDTO[], Error, HostResponseDTO>({
    queryKey: hostKeys.all(),
    queryFn: getHosts,
    select: (hosts) => {
        const host = hosts.find((h) => h.username === username);
        if (!host) throw new Error('호스트를 찾을 수 없습니다.');
        return host;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!username,
});

export const useHostCalendar = (username: string) => useQuery<ICalendar | null>({
    queryKey: ['host', 'calendar', username],
    queryFn: () => getCalendarEvent(username),
    enabled: !!username,
});

export const useHostTimeslots = (hostId: string | undefined) => useQuery<ITimeSlot[]>({
    queryKey: ['host', 'timeslots', hostId],
    queryFn: () => getTimeslotsByHostId(hostId!),
    enabled: !!hostId,
});

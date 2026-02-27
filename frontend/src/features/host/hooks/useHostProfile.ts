import { useQuery } from '@tanstack/react-query';
import { httpClient } from '~/libs/httpClient';
import { getCalendarEvent, getTimeslotsByHostId } from '~/features/calendar';
import type { HostResponseDTO } from '~/features/member';
import type { ICalendar, ITimeSlot } from '~/features/calendar';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export function useHostProfile(username: string) {
    return useQuery<HostResponseDTO[], Error, HostResponseDTO>({
        queryKey: ['hosts'],
        queryFn: () => httpClient<HostResponseDTO[]>(`${API_BASE}/members/v1/hosts`),
        select: (hosts) => {
            const host = hosts.find((h) => h.username === username);
            if (!host) throw new Error('호스트를 찾을 수 없습니다.');
            return host;
        },
        staleTime: 5 * 60 * 1000,
        enabled: !!username,
    });
}

export function useHostCalendar(username: string) {
    return useQuery<ICalendar | null>({
        queryKey: ['host', 'calendar', username],
        queryFn: () => getCalendarEvent(username),
        enabled: !!username,
    });
}

export function useHostTimeslots(hostId: string | undefined) {
    return useQuery<ITimeSlot[]>({
        queryKey: ['host', 'timeslots', hostId],
        queryFn: () => getTimeslotsByHostId(hostId!),
        enabled: !!hostId,
    });
}

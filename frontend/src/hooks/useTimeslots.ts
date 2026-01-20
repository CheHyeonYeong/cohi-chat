import { useQuery } from '@tanstack/react-query';
import { httpClient } from '~/libs/httpClient';
import { ITimeSlot } from '~/types/timeslot';
import { useHost } from './useHost';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export function useTimeslots(hostname: string) {
    const { data: host } = useHost(hostname);

    return useQuery<ITimeSlot[]>({
        queryKey: ['timeslots', hostname, host?.id],
        queryFn: async () => {
            if (!host?.id) throw new Error("Host not found");

            const url = `${API_URL}/timeslot/v1/hosts/${host.id}`;
            const data: ITimeSlot[] = await httpClient(url);
            return data;
        },
        enabled: !!host?.id,
    });
} 

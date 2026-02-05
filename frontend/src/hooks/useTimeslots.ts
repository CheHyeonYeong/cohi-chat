import { useQuery } from '@tanstack/react-query';
import { httpClient } from '~/libs/httpClient';
import { ITimeSlot } from '~/types/timeslot';
import { useAuth } from './useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export function useTimeslots(hostname: string) {
    const auth = useAuth();

    return useQuery<ITimeSlot[]>({
        queryKey: ['timeslots', hostname, auth.data?.id],
        queryFn: async () => {
            // Get member info to find the host UUID
            const memberData = await httpClient<{ id: string }>(`${API_URL}/members/v1/${encodeURIComponent(hostname)}`);
            if (!memberData?.id) throw new Error("Host not found");

            const url = `${API_URL}/timeslot/v1/hosts/${memberData.id}`;
            const data: ITimeSlot[] = await httpClient(url);
            return data;
        },
        enabled: !!hostname && auth.isAuthenticated,
    });
}

import { useQuery } from '@tanstack/react-query';
import { getServiceAccountEmail } from '../api/hostCalendarApi';
import { hostKeys } from './queryKeys';

export function useServiceAccountEmail() {
    const { data, isError } = useQuery({
        queryKey: hostKeys.serviceAccountEmail(),
        queryFn: getServiceAccountEmail,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    return {
        serviceAccountEmail: data?.serviceAccountEmail ?? '',
        isError,
    };
}

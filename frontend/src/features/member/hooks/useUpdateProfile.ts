import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfileApi } from '../api/memberApi';
import type { UpdateProfilePayload, HostResponseDTO } from '../types';

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation<HostResponseDTO, Error, UpdateProfilePayload>({
        mutationFn: updateProfileApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hosts'] });
        },
    });
}

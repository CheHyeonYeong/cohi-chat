import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteProfileImageApi } from '../api';

export const useDeleteProfileImage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProfileImageApi,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auth'] });
        },
    });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMemberApi } from '../api/memberApi';
import type { UpdateMemberPayload, MemberResponseDTO } from '../types';

export function useUpdateMember(username: string) {
    const queryClient = useQueryClient();
    return useMutation<MemberResponseDTO, Error, UpdateMemberPayload>({
        mutationFn: (payload) => updateMemberApi(username, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['auth'] });
        },
    });
}

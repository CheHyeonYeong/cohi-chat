import { useQuery } from '@tanstack/react-query';
import { getChatRooms } from '../api';
import { chatKeys } from './queryKeys';

export const useChatRooms = (options?: { enabled?: boolean }) => useQuery({
    queryKey: chatKeys.roomsAll(),
    queryFn: getChatRooms,
    enabled: options?.enabled ?? true,
});

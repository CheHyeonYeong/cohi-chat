import { useQuery } from '@tanstack/react-query';
import { getChatRooms } from '../api';
import { chatKeys } from './queryKeys';

export function useChatRooms(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: chatKeys.roomsAll(),
    queryFn: getChatRooms,
    enabled: options?.enabled ?? true,
  });
}

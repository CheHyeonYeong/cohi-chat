import { useQuery } from '@tanstack/react-query';
import { getChatRooms } from '../api';
import { chatKeys } from './queryKeys';

export function useChatRooms() {
  return useQuery({
    queryKey: chatKeys.roomsAll(),
    queryFn: getChatRooms,
  });
}

import { useQuery } from '@tanstack/react-query';
import { getChatMessages } from '../api';
import { chatKeys } from './queryKeys';

export function useChatMessages(roomId: string | undefined) {
  return useQuery({
    queryKey: roomId ? chatKeys.messagesAll(roomId) : ['chat-messages-disabled'],
    queryFn: () => getChatMessages(roomId!),
    enabled: !!roomId,
  });
}

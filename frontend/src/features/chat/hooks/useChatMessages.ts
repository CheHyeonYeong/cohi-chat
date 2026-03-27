import { useQuery } from '@tanstack/react-query';
import { getChatMessages } from '../api';
import { chatKeys } from './queryKeys';

export const useChatMessages = (roomId: string | undefined) => useQuery({
    queryKey: roomId ? chatKeys.messagesAll(roomId) : ['chat-messages-disabled'],
    queryFn: () => getChatMessages(roomId!),
    enabled: !!roomId,
});

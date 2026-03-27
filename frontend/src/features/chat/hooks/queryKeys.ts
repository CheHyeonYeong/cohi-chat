export const chatKeys = {
    roomsAll: () => ['chat-rooms'] as const,
    messagesAll: (roomId: string) => ['chat-messages', roomId] as const,
    messages: (roomId: string, cursor?: string) =>
    ['chat-messages', roomId, cursor] as const,
};

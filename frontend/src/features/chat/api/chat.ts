import { httpClient } from '~/libs/httpClient';

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:3001/api';

export interface LastMessage {
  id: string;
  content: string | null;
  messageType: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  counterpartId: string;
  counterpartName: string;
  counterpartProfileImageUrl: string | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
}

export interface ReservationCardPayload {
  bookingId: number;
  topic: string;
  status: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
}

export interface MessageItem {
  id: string;
  roomId: string;
  senderId: string | null;
  messageType: 'TEXT' | 'RESERVATION_CARD' | 'SYSTEM';
  content: string | null;
  payload: ReservationCardPayload | null;
  createdAt: string;
}

export interface MessagePage {
  messages: MessageItem[];
  nextCursor: string | null;
}

export async function getChatRooms(): Promise<ChatRoom[]> {
  return httpClient<ChatRoom[]>(`${CHAT_API_URL}/chat/rooms`);
}

export async function getChatMessages(
  roomId: string,
  cursor?: string,
  size?: number,
): Promise<MessagePage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (size) params.set('size', String(size));
  const query = params.toString() ? `?${params.toString()}` : '';
  return httpClient<MessagePage>(`${CHAT_API_URL}/chat/rooms/${roomId}/messages${query}`);
}

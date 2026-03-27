export interface LastMessageDto {
  id: string;
  content: string | null;
  messageType: string;
  createdAt: string;
}

export class RoomResponseDto {
  id: string;
  status: string;
  counterpartId: string;
  counterpartName: string;
  counterpartProfileImageUrl: string | null;
  lastMessage: LastMessageDto | null;
  unreadCount: number;
}

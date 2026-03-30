import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';
import { RoomResponseDto } from './dto/room-response.dto';

@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // GET /api/chat/rooms — 내가 속한 채팅방 목록 + 마지막 메시지 + unread 수
  @Get('rooms')
  async getRooms(@Req() req: FastifyRequest): Promise<RoomResponseDto[]> {
    return this.chatService.getRooms(req.user.sub);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';
import { RoomResponseDto } from './dto/room-response.dto';
import { UpdateReadCursorDto } from './dto/update-read-cursor.dto';

@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // GET /api/chat/rooms — 내가 속한 채팅방 목록 + 마지막 메시지 + unread 수
  @Get('rooms')
  async getRooms(@Req() req: FastifyRequest): Promise<RoomResponseDto[]> {
    return this.chatService.getRooms(req.user.sub);
  }

  // PATCH /api/chat/rooms/:roomId/read-cursor — 읽음 커서 갱신
  @Patch('rooms/:roomId/read-cursor')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateReadCursor(
    @Param('roomId') roomId: string,
    @Body() dto: UpdateReadCursorDto,
    @Req() req: FastifyRequest,
  ): Promise<void> {
    await this.chatService.updateReadCursor(roomId, req.user.sub, dto.lastReadMessageId);
  }
}

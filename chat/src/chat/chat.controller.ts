import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

// Spring의 @RestController + @RequestMapping("/chat") 에 대응
// global prefix 'api'가 붙으므로 실제 경로: POST /api/chat/rooms/:roomId/messages
@Controller('chat')
@UseGuards(JwtGuard) // Spring의 @PreAuthorize 또는 SecurityFilterChain 보호에 대응
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms/:roomId/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('roomId') roomId: string,
    @Body() dto: SendMessageDto,
    @Request() req: FastifyRequest,
  ) {
    // req.user.sub = JWT의 subject 클레임 = Spring member UUID
    const userId = req.user.sub;
    return this.chatService.sendMessage(roomId, userId, dto);
  }
}

import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessagePageResponse } from './dto/message-response.dto';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Spring의 @RestController + @RequestMapping("/chat")에 대응
// global prefix "api"와 합쳐져 → /api/chat/...
@Controller('chat')
@UseGuards(JwtGuard) // Spring의 @SecurityRequirement — 모든 메서드에 JWT 인증 적용
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // GET /api/chat/rooms/:roomId/messages?cursor=&size=
  @Get('rooms/:roomId/messages')
  async getMessages(
    @Param('roomId') roomId: string,
    @Query() query: GetMessagesDto,
    @Req() req: FastifyRequest, // Spring의 @AuthenticationPrincipal에 대응
  ): Promise<MessagePageResponse> {
    const size = Math.min(
      Math.max(Number(query.size) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE,
    );

    // request.user는 JwtGuard가 JWT 검증 후 주입 (fastify.d.ts에 타입 선언됨)
    return this.chatService.getMessages(
      roomId,
      req.user.sub,
      query.cursor,
      size,
    );
  }
}

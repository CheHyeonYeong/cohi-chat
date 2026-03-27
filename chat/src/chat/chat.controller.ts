import {
  BadRequestException,
  Controller,
  Get,
  Param,
  PipeTransform,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RoomResponseDto } from './dto/room-response.dto';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';
import { MessagePageResponse } from './dto/message-response.dto';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// Spring의 @InitBinder + Validator에 대응 — cursor 쿼리 파라미터 ISO 8601 검증 파이프
class ParseCursorPipe implements PipeTransform {
  transform(value: unknown): string | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string' || isNaN(new Date(value).getTime())) {
      throw new BadRequestException(
        'cursor 형식이 올바르지 않습니다. ISO 8601 타임스탬프를 사용하세요.',
      );
    }
    return value;
  }
}

// Spring의 @RestController + @RequestMapping("/chat")에 대응
// global prefix "api"와 합쳐져 → /api/chat/...
@Controller('chat')
@UseGuards(JwtGuard) // Spring의 @SecurityRequirement — 모든 메서드에 JWT 인증 적용
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // GET /api/chat/rooms — 내가 속한 채팅방 목록 + 마지막 메시지 + unread 수
  @Get('rooms')
  async getRooms(@Req() req: FastifyRequest): Promise<RoomResponseDto[]> {
    return this.chatService.getRooms(req.user.sub);
  }

  // GET /api/chat/rooms/:roomId/messages?cursor=&size=
  @Get('rooms/:roomId/messages')
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('cursor', ParseCursorPipe) cursor: string | undefined,
    @Query('size') size: string | undefined,
    @Req() req: FastifyRequest, // Spring의 @AuthenticationPrincipal에 대응
  ): Promise<MessagePageResponse> {
    const pageSize = Math.min(
      Math.max(Number(size) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE,
    );

    // request.user는 JwtGuard가 JWT 검증 후 주입 (fastify.d.ts에 타입 선언됨)
    return this.chatService.getMessages(
      roomId,
      req.user.sub,
      cursor,
      pageSize,
    );
  }
}

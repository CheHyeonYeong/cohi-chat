import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';
import { RoomResponseDto } from './dto/room-response.dto';

@ApiTags('chat')
@ApiBearerAuth('jwtAuth')
@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // GET /api/chat/rooms — 내가 속한 채팅방 목록 + 마지막 메시지 + unread 수
  @Get('rooms')
  @ApiOperation({
    summary: '채팅방 목록 조회',
    description:
      '내가 속한 채팅방 목록과 상대방 정보, 마지막 메시지, unread 수를 반환합니다. 메시지가 한 번도 없는 방은 lastMessage가 null입니다.',
  })
  @ApiOkResponse({
    description: '채팅방 목록 조회 성공',
    type: RoomResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: '유효한 Bearer JWT가 필요합니다.' })
  async getRooms(@Req() req: FastifyRequest): Promise<RoomResponseDto[]> {
    return this.chatService.getRooms(req.user!.sub);
  }
}

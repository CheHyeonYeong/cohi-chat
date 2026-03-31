import {
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
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
      '내가 속한 채팅방 목록과 상대방 정보, 마지막 메시지, unread 수를 반환합니다. 메시지가 한 번도 없는 방은 lastMessage가 null입니다. Swagger Authorize에는 access token 원문만 넣고 Bearer 접두사는 따로 입력하지 않습니다.',
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

  @Patch('rooms/:roomId/read')
  @HttpCode(204)
  @ApiOperation({
    summary: '채팅방 읽음 처리',
    description:
      '현재 사용자의 채팅방 last_read_message_id를 해당 방의 최신 메시지로 갱신합니다.',
  })
  @ApiNoContentResponse({ description: '읽음 처리 성공' })
  @ApiNotFoundResponse({
    description: '사용자, 채팅방 또는 채팅방 멤버십을 찾을 수 없습니다.',
  })
  @ApiUnauthorizedResponse({ description: '유효한 Bearer JWT가 필요합니다.' })
  async markRoomAsRead(
    @Param('roomId') roomId: string,
    @Req() req: FastifyRequest,
  ): Promise<void> {
    await this.chatService.markRoomAsRead(roomId, req.user!.sub);
  }
}

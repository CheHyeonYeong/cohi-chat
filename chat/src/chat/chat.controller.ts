import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import {
  ChatRoomResponseDto,
  MarkRoomAsReadResponseDto,
  UnreadSummaryResponseDto,
} from './dto/chat-response.dto';
import { ChatService } from './chat.service';

@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  listRooms(@Req() request: FastifyRequest): Promise<ChatRoomResponseDto[]> {
    return this.chatService.listRooms(this.getMemberId(request));
  }

  @Get('unread-summary')
  getUnreadSummary(
    @Req() request: FastifyRequest,
  ): Promise<UnreadSummaryResponseDto> {
    return this.chatService.getUnreadSummary(this.getMemberId(request));
  }

  @Patch('rooms/:roomId/read')
  markRoomAsRead(
    @Req() request: FastifyRequest,
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
  ): Promise<MarkRoomAsReadResponseDto> {
    return this.chatService.markRoomAsRead(this.getMemberId(request), roomId);
  }

  private getMemberId(request: FastifyRequest): string {
    const memberId = request.user?.sub;
    if (!memberId) {
      throw new UnauthorizedException('인증 사용자 정보를 찾을 수 없습니다.');
    }

    return memberId;
  }
}

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
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import {
  ChatRoomResponseDto,
  MarkRoomAsReadResponseDto,
  UnreadSummaryResponseDto,
} from './dto/chat-response.dto';
import { ChatService } from './chat.service';

@ApiTags('chat')
@ApiBearerAuth('bearer')
@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({
    summary: '채팅방 목록 조회',
    description:
      '사용자가 속한 채팅방 목록과 마지막 메시지, unread count를 반환합니다.',
  })
  @ApiOkResponse({
    type: ChatRoomResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: '유효한 JWT가 필요합니다.',
  })
  @Get('rooms')
  listRooms(@Req() request: FastifyRequest): Promise<ChatRoomResponseDto[]> {
    return this.chatService.listRooms(this.getMemberId(request));
  }

  @ApiOperation({
    summary: '전체 unread 요약 조회',
    description:
      '사용자가 속한 채팅방의 unread 합계와 방별 unread count를 반환합니다.',
  })
  @ApiOkResponse({
    type: UnreadSummaryResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '유효한 JWT가 필요합니다.',
  })
  @Get('unread-summary')
  getUnreadSummary(
    @Req() request: FastifyRequest,
  ): Promise<UnreadSummaryResponseDto> {
    return this.chatService.getUnreadSummary(this.getMemberId(request));
  }

  @ApiOperation({
    summary: '채팅방 읽음 처리',
    description:
      '사용자가 채팅방에 진입했을 때 해당 방의 최신 메시지까지 읽음으로 처리합니다.',
  })
  @ApiOkResponse({
    type: MarkRoomAsReadResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '유효한 JWT가 필요합니다.',
  })
  @ApiNotFoundResponse({
    description: '접근 가능한 채팅방이 아닙니다.',
  })
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
      throw new UnauthorizedException('인증이 필요합니다.');
    }

    return memberId;
  }
}

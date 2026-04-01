import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';
import { MessageDto, MessagePageResponse } from './dto/message-response.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ParseCursorPipe } from './pipes/parse-cursor.pipe';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

@ApiTags('chat')
@ApiBearerAuth('jwtAuth')
@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({
    summary: '채팅방 목록 조회',
    description:
      '내가 속한 채팅방 목록과 상대방 정보, 마지막 메시지, unread 수를 반환합니다. 메시지가 없는 방은 lastMessage가 null입니다.',
  })
  @ApiOkResponse({
    description: '채팅방 목록 조회 성공',
    type: RoomResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: '유효한 Bearer JWT가 필요합니다.' })
  async getRooms(@Request() req: FastifyRequest): Promise<RoomResponseDto[]> {
    return this.chatService.getRooms(this.getUsername(req));
  }

  @Get('rooms/:roomId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '메시지 목록 조회',
    description:
      '특정 채팅방의 메시지를 최신순으로 조회합니다. nextCursor를 사용하면 이전 페이지를 이어서 조회할 수 있습니다.',
  })
  @ApiParam({
    name: 'roomId',
    description: '조회할 채팅방 UUID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: '이전 페이지 조회용 ISO 8601 커서',
    example: '2026-03-28T23:59:00.000Z',
  })
  @ApiQuery({
    name: 'size',
    required: false,
    description: `페이지 크기. 기본 ${DEFAULT_PAGE_SIZE}, 최대 ${MAX_PAGE_SIZE}`,
    example: DEFAULT_PAGE_SIZE,
  })
  @ApiResponse({
    status: 200,
    type: MessagePageResponse,
    description: '메시지 목록과 다음 페이지 cursor를 반환합니다.',
  })
  @ApiResponse({
    status: 400,
    description: 'roomId 또는 cursor 형식이 잘못되었습니다.',
  })
  @ApiResponse({ status: 401, description: '유효한 Bearer JWT가 필요합니다.' })
  @ApiResponse({ status: 403, description: '해당 채팅방 멤버가 아닙니다.' })
  async getMessages(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query('cursor', ParseCursorPipe) cursor: Date | undefined,
    @Query('size') size: string | undefined,
    @Request() req: FastifyRequest,
  ) {
    const username = this.getUsername(req);
    const parsedSize = Number.parseInt(size ?? '', 10);
    const pageSize =
      Number.isNaN(parsedSize) || parsedSize <= 0
        ? DEFAULT_PAGE_SIZE
        : Math.min(parsedSize, MAX_PAGE_SIZE);

    return this.chatService.getMessages(roomId, username, cursor, pageSize);
  }

  @Post('rooms/:roomId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '메시지 전송',
    description:
      '채팅방 멤버가 텍스트 메시지를 전송합니다. content는 trim 후 저장되고 공백-only 입력은 거부됩니다.',
  })
  @ApiParam({
    name: 'roomId',
    description: '메시지를 전송할 채팅방 UUID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @ApiResponse({ status: 201, type: MessageDto, description: '저장된 메시지' })
  @ApiResponse({
    status: 400,
    description: 'roomId 형식이 잘못됐거나 메시지 내용이 비어 있습니다.',
  })
  @ApiResponse({ status: 401, description: '유효한 Bearer JWT가 필요합니다.' })
  @ApiResponse({ status: 403, description: '해당 채팅방 멤버가 아닙니다.' })
  async sendMessage(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: SendMessageDto,
    @Request() req: FastifyRequest,
  ) {
    return this.chatService.sendMessage(roomId, this.getUsername(req), dto);
  }

  private getUsername(request: FastifyRequest): string {
    const user = request.user;

    if (!user?.sub) {
      throw new UnauthorizedException('유효한 인증 정보가 없습니다.');
    }

    return user.sub;
  }
}

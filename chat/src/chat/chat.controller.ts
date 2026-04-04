import {
  BadRequestException,
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
import { MessageCursor } from './message-cursor';
import { MessageDto, MessagePageResponse } from './dto/message-response.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ParseCursorPipe } from './pipes/parse-cursor.pipe';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const CURSOR_EXAMPLE =
  'eyJjcmVhdGVkQXQiOiIyMDI2LTAzLTMxVDAwOjAwOjAwLjEyMzAwMVoiLCJpZCI6IjExMTExMTExLTExMTEtNDExMS04MTExLTExMTExMTExMTExMSJ9';

@ApiTags('chat')
@ApiBearerAuth('jwtAuth')
@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({
    summary: 'Get chat rooms',
    description:
      'Returns the authenticated user\'s room list with counterpart info, last message, and unread counts. lastMessage is null when the room has no messages.',
  })
  @ApiOkResponse({
    description: 'Successfully fetched the chat room list.',
    type: RoomResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'A valid Bearer JWT is required.',
  })
  async getRooms(@Request() req: FastifyRequest): Promise<RoomResponseDto[]> {
    return this.chatService.getRooms(this.getUsername(req));
  }

  @Get('rooms/:roomId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get room messages',
    description:
      'Returns room messages in reverse chronological order. Use nextCursor to continue fetching older pages.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Chat room UUID.',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description:
      'Opaque cursor copied from the previous response\'s nextCursor value.',
    example: CURSOR_EXAMPLE,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    description: `Page size. Default ${DEFAULT_PAGE_SIZE}, maximum ${MAX_PAGE_SIZE}.`,
    example: DEFAULT_PAGE_SIZE,
  })
  @ApiResponse({
    status: 200,
    type: MessagePageResponse,
    description: 'Returns messages and the next page cursor.',
  })
  @ApiResponse({
    status: 400,
    description: 'roomId or cursor format is invalid.',
  })
  @ApiResponse({ status: 401, description: 'A valid Bearer JWT is required.' })
  @ApiResponse({ status: 403, description: 'The user is not a member of the room.' })
  async getMessages(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query('cursor', ParseCursorPipe) cursor: MessageCursor | undefined,
    @Query('size') size: string | undefined,
    @Request() req: FastifyRequest,
  ) {
    const username = this.getUsername(req);
    const pageSize = this.parsePageSize(size);

    return this.chatService.getMessages(roomId, username, cursor, pageSize);
  }

  @Post('rooms/:roomId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Send a message',
    description:
      'Sends a text message to a room. content is trimmed before save and whitespace-only input is rejected.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Chat room UUID to send the message to.',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @ApiResponse({ status: 201, type: MessageDto, description: 'Stored message.' })
  @ApiResponse({
    status: 400,
    description: 'roomId is invalid or the message content is empty.',
  })
  @ApiResponse({ status: 401, description: 'A valid Bearer JWT is required.' })
  @ApiResponse({ status: 403, description: 'The user is not a member of the room.' })
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
      throw new UnauthorizedException('Authenticated user info is missing.');
    }

    return user.sub;
  }

  private parsePageSize(size: string | undefined): number {
    const normalizedSize = size?.trim();
    if (!normalizedSize) {
      return DEFAULT_PAGE_SIZE;
    }

    const parsedSize = Number(normalizedSize);
    if (!Number.isSafeInteger(parsedSize) || parsedSize < 1) {
      throw new BadRequestException('size must be a positive integer.');
    }

    // 50 keeps the initial chat history page readable, while 100 caps payload and query cost.
    return Math.min(parsedSize, MAX_PAGE_SIZE);
  }
}

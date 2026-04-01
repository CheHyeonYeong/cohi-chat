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
  Req,
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
import type { JwtPayload } from '../auth/jwt.guard';
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
    summary: 'Get chat rooms',
    description:
      'Returns the current user room list with counterpart info, last message preview, and unread count.',
  })
  @ApiOkResponse({
    description: 'Chat room summaries.',
    type: RoomResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: 'A valid Bearer JWT is required.' })
  async getRooms(@Req() req: FastifyRequest): Promise<RoomResponseDto[]> {
    return this.chatService.getRooms(this.getUsername(req));
  }

  @Get('rooms/:roomId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get room messages',
    description:
      'Returns messages from a room in reverse chronological order. Use nextCursor from the response to request the next page.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Target room UUID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description:
      'ISO 8601 cursor for the next page. Omit it to fetch the latest messages.',
    example: '2026-03-28T23:59:00.000Z',
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
    description: 'Messages plus the cursor for the next page.',
  })
  @ApiResponse({
    status: 400,
    description: 'roomId or cursor has an invalid format.',
  })
  @ApiResponse({ status: 401, description: 'A valid Bearer JWT is required.' })
  @ApiResponse({
    status: 403,
    description: 'The requester is not a member of the room.',
  })
  async getMessages(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query('cursor', ParseCursorPipe) cursor: Date | undefined,
    @Query('size') size: string | undefined,
    @Req() req: FastifyRequest,
  ) {
    const username = this.getUsername(req);

    // Keep pagination predictable for clients while capping large requests
    // so one call cannot pull an arbitrarily large message window.
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
    summary: 'Send a message',
    description:
      'Stores a text message for the room. Content is trimmed before persistence and whitespace-only input is rejected.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'Target room UUID',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @ApiResponse({
    status: 201,
    type: MessageDto,
    description: 'The stored message.',
  })
  @ApiResponse({
    status: 400,
    description:
      'roomId is invalid or the message content is empty or too long.',
  })
  @ApiResponse({ status: 401, description: 'A valid Bearer JWT is required.' })
  @ApiResponse({
    status: 403,
    description: 'The requester is not a member of the room.',
  })
  async sendMessage(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: SendMessageDto,
    @Req() req: FastifyRequest,
  ) {
    const username = this.getUsername(req);
    return this.chatService.sendMessage(roomId, username, dto);
  }

  private getUsername(request: FastifyRequest): string {
    const user = request.user as JwtPayload | undefined;
    const username = user?.username ?? user?.sub;

    if (!username) {
      throw new UnauthorizedException('Missing authenticated user context.');
    }

    return username;
  }
}

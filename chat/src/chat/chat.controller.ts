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
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import { ListRoomMessagesQuery } from './dto/list-room-messages.dto';
import { MarkRoomReadDto } from './dto/mark-room-read.dto';
import { MessageDto } from './dto/message-response.dto';
import {
  PollMessageResponse,
  PollMessagesQuery,
} from './dto/poll-messages.dto';
import { ReadStateDto } from './dto/read-state-response.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  ChatService,
  DEFAULT_ROOM_MESSAGE_LIMIT,
  MAX_ROOM_MESSAGE_LIMIT,
  MAX_POLL_TIMEOUT_SECONDS,
  RECOMMENDED_POLL_REQUEST_TIMEOUT_SECONDS,
} from './chat.service';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INTEGER_STRING_PATTERN = /^\d+$/;

const ROOMS_SUMMARY = 'Get chat rooms';
const ROOMS_DESCRIPTION =
  'Returns the caller room list, counterpart information, last message, and unread count.';
const ROOMS_OK = 'Chat room summaries';
const AUTH_REQUIRED = 'A valid Bearer JWT is required.';
const SEND_SUMMARY = 'Send a message';
const SEND_DESCRIPTION =
  'Stores a text message for the room and wakes pending long polling requests in the same chat server process.';
const SEND_OK = 'Stored message';
const SEND_BAD_REQUEST =
  'roomId is invalid or the message content is empty or too long.';
const MESSAGE_LIST_SUMMARY = 'Get room messages';
const MESSAGE_LIST_DESCRIPTION =
  'Returns the latest room messages in ascending order. Use beforeMessageId to page backward to older messages.';
const MESSAGE_LIST_OK = 'Room messages';
const MESSAGE_LIST_BAD_REQUEST =
  'roomId, beforeMessageId, or limit is invalid.';
const POLL_SUMMARY = 'Poll new messages';
const POLL_DESCRIPTION =
  'Returns messages after sinceMessageId immediately when available, otherwise waits up to 25 seconds and returns an empty array on timeout.';
const READ_SUMMARY = 'Mark room messages as read';
const READ_DESCRIPTION =
  'Stores the room read cursor for the caller. Omitting lastReadMessageId marks the latest room message as read.';
const READ_OK = 'Updated read state';
const ROOM_ID_DESCRIPTION = 'Chat room UUID';
const BEFORE_MESSAGE_ID_DESCRIPTION =
  'Fetch messages older than this message ID.';
const MESSAGE_LIMIT_DESCRIPTION = `Number of messages to return (1-${MAX_ROOM_MESSAGE_LIMIT}). Defaults to ${DEFAULT_ROOM_MESSAGE_LIMIT}.`;
const SINCE_MESSAGE_ID_DESCRIPTION =
  'Last received message UUID. Omit it to wait only for messages created after this poll request started.';
const TIMEOUT_DESCRIPTION = `Long polling timeout in seconds (0-${MAX_POLL_TIMEOUT_SECONDS}). Omit it to wait up to ${MAX_POLL_TIMEOUT_SECONDS} seconds for new messages, or use 0 to return immediately without waiting. Client and proxy timeouts should be at least ${RECOMMENDED_POLL_REQUEST_TIMEOUT_SECONDS} seconds.`;
const POLL_OK = 'Messages or an empty array on timeout';
const POLL_BAD_REQUEST = 'roomId, sinceMessageId, or timeout is invalid.';
const POLL_FORBIDDEN = 'The requester is not allowed to access this room.';

@ApiTags('chat')
@ApiBearerAuth('jwtAuth')
@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({
    summary: ROOMS_SUMMARY,
    description: ROOMS_DESCRIPTION,
  })
  @ApiOkResponse({
    description: ROOMS_OK,
    type: RoomResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({ description: AUTH_REQUIRED })
  async getRooms(@Req() req: FastifyRequest): Promise<RoomResponseDto[]> {
    return this.chatService.getRooms(this.getUsername(req));
  }

  @Post('rooms/:roomId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: SEND_SUMMARY,
    description: SEND_DESCRIPTION,
  })
  @ApiParam({
    name: 'roomId',
    description: ROOM_ID_DESCRIPTION,
  })
  @ApiCreatedResponse({
    description: SEND_OK,
    type: MessageDto,
  })
  @ApiBadRequestResponse({
    description: SEND_BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({ description: AUTH_REQUIRED })
  @ApiForbiddenResponse({ description: POLL_FORBIDDEN })
  async sendMessage(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: SendMessageDto,
    @Req() request: FastifyRequest,
  ): Promise<MessageDto> {
    return this.chatService.sendMessage(roomId, this.getUsername(request), dto);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({
    summary: MESSAGE_LIST_SUMMARY,
    description: MESSAGE_LIST_DESCRIPTION,
  })
  @ApiParam({
    name: 'roomId',
    description: ROOM_ID_DESCRIPTION,
  })
  @ApiQuery({
    name: 'beforeMessageId',
    required: false,
    type: String,
    format: 'uuid',
    description: BEFORE_MESSAGE_ID_DESCRIPTION,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: DEFAULT_ROOM_MESSAGE_LIMIT,
    description: MESSAGE_LIMIT_DESCRIPTION,
  })
  @ApiOkResponse({
    description: MESSAGE_LIST_OK,
    type: MessageDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: MESSAGE_LIST_BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({ description: AUTH_REQUIRED })
  @ApiForbiddenResponse({ description: POLL_FORBIDDEN })
  async getRoomMessages(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Query('beforeMessageId') beforeMessageId: string | undefined,
    @Query('limit') limit: string | undefined,
    @Req() request: FastifyRequest,
  ): Promise<MessageDto[]> {
    return this.chatService.getRoomMessages(
      roomId,
      this.getUsername(request),
      this.parseMessageListQuery({
        beforeMessageId,
        limit,
      }),
    );
  }

  @Post('rooms/:roomId/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: READ_SUMMARY,
    description: READ_DESCRIPTION,
  })
  @ApiParam({
    name: 'roomId',
    description: ROOM_ID_DESCRIPTION,
  })
  @ApiOkResponse({
    description: READ_OK,
    type: ReadStateDto,
  })
  @ApiBadRequestResponse({
    description: POLL_BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({ description: AUTH_REQUIRED })
  @ApiForbiddenResponse({ description: POLL_FORBIDDEN })
  async markRoomRead(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: MarkRoomReadDto,
    @Req() request: FastifyRequest,
  ): Promise<ReadStateDto> {
    return this.chatService.markRoomRead(
      roomId,
      this.getUsername(request),
      dto,
    );
  }

  @Get('poll')
  @ApiOperation({
    summary: POLL_SUMMARY,
    description: POLL_DESCRIPTION,
  })
  @ApiQuery({
    name: 'roomId',
    required: true,
    type: String,
    format: 'uuid',
    description: ROOM_ID_DESCRIPTION,
  })
  @ApiQuery({
    name: 'sinceMessageId',
    required: false,
    type: String,
    format: 'uuid',
    description: SINCE_MESSAGE_ID_DESCRIPTION,
  })
  @ApiQuery({
    name: 'timeout',
    required: false,
    type: Number,
    example: MAX_POLL_TIMEOUT_SECONDS,
    description: TIMEOUT_DESCRIPTION,
  })
  @ApiOkResponse({
    description: POLL_OK,
    type: PollMessageResponse,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: POLL_BAD_REQUEST,
  })
  @ApiUnauthorizedResponse({ description: AUTH_REQUIRED })
  @ApiForbiddenResponse({ description: POLL_FORBIDDEN })
  async pollMessages(
    @Query('roomId') roomId: string | undefined,
    @Query('sinceMessageId') sinceMessageId: string | undefined,
    @Query('timeout') timeout: string | undefined,
    @Req() request: FastifyRequest,
  ): Promise<PollMessageResponse[]> {
    const query = this.parsePollQuery({
      roomId,
      sinceMessageId,
      timeoutSeconds: timeout,
    });

    const abortController = new AbortController();
    const socket = request.raw.socket;
    const closeHandler = () => abortController.abort();

    request.raw.once('aborted', closeHandler);
    socket?.once('close', closeHandler);

    try {
      return await this.chatService.pollMessages({
        ...query,
        username: this.getUsername(request),
        abortSignal: abortController.signal,
      });
    } finally {
      request.raw.off('aborted', closeHandler);
      socket?.off('close', closeHandler);
    }
  }

  private parsePollQuery(rawQuery: {
    roomId?: string;
    sinceMessageId?: string;
    timeoutSeconds?: string;
  }): PollMessagesQuery {
    const roomId = rawQuery.roomId?.trim();
    const hasSinceMessageId = rawQuery.sinceMessageId !== undefined;
    const sinceMessageIdText = rawQuery.sinceMessageId?.trim();

    if (hasSinceMessageId && sinceMessageIdText === '') {
      throw new BadRequestException('sinceMessageId must be a UUID.');
    }

    const sinceMessageId = sinceMessageIdText || undefined;
    const timeoutText = rawQuery.timeoutSeconds?.trim();

    if (
      timeoutText !== undefined &&
      !INTEGER_STRING_PATTERN.test(timeoutText)
    ) {
      throw new BadRequestException(
        'timeout must be a non-negative integer string.',
      );
    }

    const timeoutSeconds =
      timeoutText === undefined
        ? MAX_POLL_TIMEOUT_SECONDS
        : Number.parseInt(timeoutText, 10);

    if (timeoutSeconds < 0 || timeoutSeconds > MAX_POLL_TIMEOUT_SECONDS) {
      throw new BadRequestException(
        `timeout must be between 0 and ${MAX_POLL_TIMEOUT_SECONDS}.`,
      );
    }

    if (!roomId || !UUID_PATTERN.test(roomId)) {
      throw new BadRequestException('roomId must be a UUID.');
    }

    if (sinceMessageId && !UUID_PATTERN.test(sinceMessageId)) {
      throw new BadRequestException('sinceMessageId must be a UUID.');
    }

    return {
      roomId,
      sinceMessageId,
      timeoutSeconds,
    };
  }

  private parseMessageListQuery(rawQuery: {
    beforeMessageId?: string;
    limit?: string;
  }): ListRoomMessagesQuery {
    const hasBeforeMessageId = rawQuery.beforeMessageId !== undefined;
    const beforeMessageIdText = rawQuery.beforeMessageId?.trim();

    if (hasBeforeMessageId && beforeMessageIdText === '') {
      throw new BadRequestException('beforeMessageId must be a UUID.');
    }

    const beforeMessageId = beforeMessageIdText || undefined;
    const limitText = rawQuery.limit?.trim();

    if (limitText !== undefined && !INTEGER_STRING_PATTERN.test(limitText)) {
      throw new BadRequestException('limit must be a positive integer string.');
    }

    const limit =
      limitText === undefined
        ? DEFAULT_ROOM_MESSAGE_LIMIT
        : Number.parseInt(limitText, 10);

    if (limit < 1 || limit > MAX_ROOM_MESSAGE_LIMIT) {
      throw new BadRequestException(
        `limit must be between 1 and ${MAX_ROOM_MESSAGE_LIMIT}.`,
      );
    }

    if (beforeMessageId && !UUID_PATTERN.test(beforeMessageId)) {
      throw new BadRequestException('beforeMessageId must be a UUID.');
    }

    return {
      beforeMessageId,
      limit,
    };
  }

  private getUsername(request: FastifyRequest): string {
    const user = request.user;

    if (!user?.sub) {
      throw new UnauthorizedException('Missing authenticated user context.');
    }

    return user.sub;
  }
}

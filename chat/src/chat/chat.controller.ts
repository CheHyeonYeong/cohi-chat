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
import { MessageDto } from './dto/message-response.dto';
import {
  PollMessageResponse,
  PollMessagesQuery,
} from './dto/poll-messages.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  ChatService,
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
const POLL_SUMMARY = 'Poll new messages';
const POLL_DESCRIPTION =
  'Returns messages after sinceMessageId immediately when available, otherwise waits up to 25 seconds and returns an empty array on timeout.';
const ROOM_ID_DESCRIPTION = 'Chat room UUID';
const SINCE_MESSAGE_ID_DESCRIPTION =
  'Last received message UUID. Omit it to wait only for messages created after this poll request started.';
const TIMEOUT_DESCRIPTION = `Long polling timeout in seconds. Maximum 25 seconds. Client and proxy timeouts should be at least ${RECOMMENDED_POLL_REQUEST_TIMEOUT_SECONDS} seconds.`;
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
  @ApiOkResponse({
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
      throw new BadRequestException('timeout must be an integer string.');
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

  private getUsername(request: FastifyRequest): string {
    const user = request.user;

    if (!user?.sub) {
      throw new UnauthorizedException('Missing authenticated user context.');
    }

    return user.sub;
  }
}

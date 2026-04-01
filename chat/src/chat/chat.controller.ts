import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import {
  PollMessageResponse,
  PollMessagesQuery,
} from './dto/poll-messages.dto';
import { ChatService, MAX_POLL_TIMEOUT_SECONDS } from './chat.service';
import { RoomResponseDto } from './dto/room-response.dto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INTEGER_STRING_PATTERN = /^\d+$/;

const ROOMS_SUMMARY = '\uCC44\uD305\uBC29 \uBAA9\uB85D \uC870\uD68C';
const ROOMS_DESCRIPTION =
  '\uB0B4\uAC00 \uC18D\uD55C \uCC44\uD305\uBC29 \uBAA9\uB85D\uACFC \uC0C1\uB300\uBC29 \uC815\uBCF4, \uB9C8\uC9C0\uB9C9 \uBA54\uC2DC\uC9C0, unread \uC218\uB97C \uBC18\uD658\uD569\uB2C8\uB2E4. \uBA54\uC2DC\uC9C0\uAC00 \uD55C \uBC88\uB3C4 \uC5C6\uB294 \uBC29\uC740 lastMessage\uAC00 null\uC785\uB2C8\uB2E4. Swagger Authorize\uC5D0\uB294 access token \uC6D0\uBB38\uB9CC \uB123\uACE0 Bearer \uC811\uB450\uC0AC\uB294 \uB530\uB85C \uC785\uB825\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.';
const ROOMS_OK = '\uCC44\uD305\uBC29 \uBAA9\uB85D \uC870\uD68C \uC131\uACF5';
const AUTH_REQUIRED =
  '\uC720\uD6A8\uD55C Bearer JWT\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.';
const POLL_SUMMARY = '\uC0C8 \uBA54\uC2DC\uC9C0 long polling';
const POLL_DESCRIPTION =
  'sinceMessageId \uC774\uD6C4 \uBA54\uC2DC\uC9C0\uAC00 \uC788\uC73C\uBA74 \uC989\uC2DC \uBC18\uD658\uD558\uACE0, \uC5C6\uC73C\uBA74 \uCD5C\uB300 25\uCD08\uAE4C\uC9C0 \uB300\uAE30\uD55C \uB4A4 \uBE48 \uBC30\uC5F4\uC744 \uBC18\uD658\uD569\uB2C8\uB2E4. sinceMessageId\uB97C \uC0DD\uB7B5\uD558\uBA74 \uC694\uCCAD \uC2DC\uC810 \uC774\uD6C4 \uB3C4\uCC29\uD55C \uC0C8 \uBA54\uC2DC\uC9C0\uB9CC \uBC18\uD658\uD569\uB2C8\uB2E4.';
const ROOM_ID_DESCRIPTION = '\uCC44\uD305\uBC29 UUID';
const SINCE_MESSAGE_ID_DESCRIPTION =
  '\uD074\uB77C\uC774\uC5B8\uD2B8\uAC00 \uB9C8\uC9C0\uB9C9\uC73C\uB85C \uBC1B\uC740 \uBA54\uC2DC\uC9C0 UUID. \uC5C6\uC73C\uBA74 poll \uC2DC\uC791 \uC774\uD6C4 \uC0C8 \uBA54\uC2DC\uC9C0\uB9CC \uAE30\uB2E4\uB9BD\uB2C8\uB2E4.';
const TIMEOUT_DESCRIPTION =
  'long polling timeout \uCD08. \uCD5C\uB300 25\uCD08';
const POLL_OK =
  '\uC0C8 \uBA54\uC2DC\uC9C0 \uBC30\uC5F4 \uB610\uB294 timeout \uC2DC \uBE48 \uBC30\uC5F4';
const POLL_BAD_REQUEST =
  'roomId, sinceMessageId, timeout \uD615\uC2DD\uC774 \uC798\uBABB\uB410\uC2B5\uB2C8\uB2E4.';
const POLL_FORBIDDEN =
  '\uD574\uB2F9 \uCC44\uD305\uBC29 \uC811\uADFC \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.';

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
    return this.chatService.getRooms(req.user!.sub);
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
    const closeHandler = () => {
      abortController.abort();
    };

    request.raw.once('aborted', closeHandler);
    socket?.once('close', closeHandler);

    try {
      return await this.chatService.pollMessages({
        ...query,
        username: request.user!.sub,
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
    const sinceMessageId = rawQuery.sinceMessageId?.trim() || undefined;
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
}

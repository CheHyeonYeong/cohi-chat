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
import { ChatService } from './chat.service';
import { RoomResponseDto } from './dto/room-response.dto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INTEGER_STRING_PATTERN = /^\d+$/;

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

  @Get('poll')
  @ApiOperation({
    summary: '새 메시지 long polling',
    description:
      'sinceMessageId 이후 메시지가 있으면 즉시 반환하고, 없으면 최대 25초까지 대기한 뒤 빈 배열을 반환합니다. sinceMessageId를 생략하면 요청 시점 이후 도착한 새 메시지만 반환합니다.',
  })
  @ApiQuery({
    name: 'roomId',
    required: true,
    type: String,
    format: 'uuid',
    description: '채팅방 UUID',
  })
  @ApiQuery({
    name: 'sinceMessageId',
    required: false,
    type: String,
    format: 'uuid',
    description:
      '클라이언트가 마지막으로 받은 메시지 UUID. 없으면 poll 시작 이후 새 메시지만 기다립니다.',
  })
  @ApiQuery({
    name: 'timeout',
    required: false,
    type: Number,
    example: 25,
    description: 'long polling timeout 초. 최대 25초',
  })
  @ApiOkResponse({
    description: '새 메시지 배열 또는 timeout 시 빈 배열',
    type: PollMessageResponse,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'roomId, sinceMessageId, timeout 형식이 잘못됐습니다.',
  })
  @ApiUnauthorizedResponse({ description: '유효한 Bearer JWT가 필요합니다.' })
  @ApiForbiddenResponse({ description: '해당 채팅방 접근 권한이 없습니다.' })
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
    const closeHandler = () => {
      abortController.abort();
    };

    request.raw.once('aborted', closeHandler);
    request.raw.once('close', closeHandler);

    try {
      return await this.chatService.pollMessages({
        ...query,
        username: request.user!.sub,
        abortSignal: abortController.signal,
      });
    } finally {
      request.raw.off('aborted', closeHandler);
      request.raw.off('close', closeHandler);
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
      timeoutText === undefined ? 25 : Number.parseInt(timeoutText, 10);

    if (!roomId || !UUID_PATTERN.test(roomId)) {
      throw new BadRequestException('roomId must be a UUID.');
    }

    if (sinceMessageId && !UUID_PATTERN.test(sinceMessageId)) {
      throw new BadRequestException('sinceMessageId must be a UUID.');
    }

    if (!Number.isInteger(timeoutSeconds)) {
      throw new BadRequestException('timeout must be an integer.');
    }

    return {
      roomId,
      sinceMessageId,
      timeoutSeconds,
    };
  }
}

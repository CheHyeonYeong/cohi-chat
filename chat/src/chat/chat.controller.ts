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
  MarkRoomAsReadResponseDto,
  UnreadSummaryResponseDto,
} from './dto/chat-response.dto';
import { RoomResponseDto } from './dto/room-response.dto';
import { ChatService } from './chat.service';

@ApiTags('chat')
@ApiBearerAuth('jwtAuth')
@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  @ApiOperation({
    summary: 'List chat rooms',
    description:
      'Returns counterpart information, last message preview, and unread count for each room.',
  })
  @ApiOkResponse({
    description: 'Chat room list retrieved successfully.',
    type: RoomResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'A valid Bearer JWT is required.',
  })
  getRooms(@Req() request: FastifyRequest): Promise<RoomResponseDto[]> {
    return this.chatService.getRooms(this.getMemberIdentifier(request));
  }

  @Get('unread-summary')
  @ApiOperation({
    summary: 'Get unread summary',
    description: 'Returns total unread count and per-room unread counts.',
  })
  @ApiOkResponse({
    type: UnreadSummaryResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'A valid Bearer JWT is required.',
  })
  getUnreadSummary(
    @Req() request: FastifyRequest,
  ): Promise<UnreadSummaryResponseDto> {
    return this.chatService.getUnreadSummary(this.getMemberIdentifier(request));
  }

  @Patch('rooms/:roomId/read')
  @ApiOperation({
    summary: 'Mark a room as read',
    description:
      'Stores the latest message in the room as the member read cursor.',
  })
  @ApiOkResponse({
    type: MarkRoomAsReadResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'A valid Bearer JWT is required.',
  })
  @ApiNotFoundResponse({
    description: 'The chat room is not accessible.',
  })
  markRoomAsRead(
    @Req() request: FastifyRequest,
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
  ): Promise<MarkRoomAsReadResponseDto> {
    return this.chatService.markRoomAsRead(
      this.getMemberIdentifier(request),
      roomId,
    );
  }

  private getMemberIdentifier(request: FastifyRequest): string {
    const memberIdentifier = request.user?.sub ?? request.user?.username;
    if (!memberIdentifier) {
      throw new UnauthorizedException('Authentication required.');
    }

    return memberIdentifier;
  }
}

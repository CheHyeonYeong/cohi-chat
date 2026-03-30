import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';
import { MessageDto, MessagePageResponse } from './dto/message-response.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ParseCursorPipe } from './pipes/parse-cursor.pipe';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms/:roomId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '메시지 목록 조회 (커서 페이징)' })
  @ApiQuery({ name: 'cursor', required: false, description: 'ISO 8601 타임스탬프. 없으면 최신 메시지부터 조회' })
  @ApiQuery({ name: 'size', required: false, description: '페이지 크기 (기본 50, 최대 100)' })
  @ApiResponse({ status: 200, type: MessagePageResponse })
  @ApiResponse({ status: 400, description: 'cursor 형식 오류' })
  @ApiResponse({ status: 403, description: '해당 채팅방 멤버 아님' })
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('cursor', ParseCursorPipe) cursor: Date | undefined,
    @Query('size') size: string,
    @Request() req: FastifyRequest,
  ) {
    // JwtGuard가 통과한 이후이므로 req.user는 항상 존재 — non-null assertion 사용
    const userId = req.user!.sub;
    const pageSize = Math.min(parseInt(size, 10) || 50, 100);
    return this.chatService.getMessages(roomId, userId, cursor, pageSize);
  }

  @Post('rooms/:roomId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '메시지 전송' })
  @ApiResponse({ status: 201, type: MessageDto })
  @ApiResponse({ status: 400, description: '공백 메시지 또는 1000자 초과' })
  @ApiResponse({ status: 403, description: '해당 채팅방 멤버 아님' })
  async sendMessage(
    @Param('roomId') roomId: string,
    @Body() dto: SendMessageDto,
    @Request() req: FastifyRequest,
  ) {
    // JwtGuard가 통과한 이후이므로 req.user는 항상 존재 — non-null assertion 사용
    const userId = req.user!.sub;
    return this.chatService.sendMessage(roomId, userId, dto);
  }
}

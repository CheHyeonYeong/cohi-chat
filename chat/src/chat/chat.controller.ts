import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms/:roomId/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '메시지 전송' })
  async sendMessage(
    @Param('roomId') roomId: string,
    @Body() dto: SendMessageDto,
    @Request() req: FastifyRequest,
  ) {
    const userId = req.user.sub;
    return this.chatService.sendMessage(roomId, userId, dto);
  }
}

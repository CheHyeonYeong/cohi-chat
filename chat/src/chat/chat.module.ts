import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';
import { ChatPollRegistry } from './chat-poll-registry';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ChatController],
  providers: [ChatPollRegistry, ChatService],
})
export class ChatModule {}

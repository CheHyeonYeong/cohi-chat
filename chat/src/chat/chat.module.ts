import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';
import { ChatPollNotifier } from './chat-poll-notifier';
import { ChatPollRegistry } from './chat-poll-registry';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ChatController],
  providers: [ChatPollRegistry, ChatPollNotifier, ChatService],
  exports: [ChatPollNotifier],
})
export class ChatModule {}

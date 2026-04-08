import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';
import {
  ChatRoomActivityNotifier,
  NoopChatRoomActivityNotifier,
} from './chat-room-activity-notifier';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ChatController],
  providers: [
    NoopChatRoomActivityNotifier,
    {
      provide: ChatRoomActivityNotifier,
      useExisting: NoopChatRoomActivityNotifier,
    },
    ChatService,
  ],
  exports: [ChatRoomActivityNotifier],
})
export class ChatModule {}

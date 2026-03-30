import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtGuard } from '../auth/jwt.guard';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule],
  controllers: [ChatController],
  providers: [ChatService, JwtGuard],
})
export class ChatModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRoom } from './entities/chat-room.entity';
import { Message } from './entities/message.entity';
import { RoomMember } from './entities/room-member.entity';

// Spring의 @Configuration + @ComponentScan 범위에 대응
// TypeOrmModule.forFeature() = Spring의 @EnableJpaRepositories 역할
@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, RoomMember, Message]),
    AuthModule, // JwtGuard 사용을 위해 import
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}

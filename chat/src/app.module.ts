import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Spring의 application.properties 역할 — 환경변수 로딩
    ConfigModule.forRoot({
      isGlobal: true, // 모든 모듈에서 별도 import 없이 사용 가능 (Spring @Value처럼)
      envFilePath: '.env',
    }),

    // Spring의 SecurityConfig + JwtTokenProvider 역할
    AuthModule,
    PrismaModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

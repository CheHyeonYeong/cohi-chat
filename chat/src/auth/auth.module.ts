import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtGuard } from './jwt.guard';

// Spring의 SecurityConfig + JwtTokenProvider를 합친 역할
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // 검증만 담당 — 토큰 발급은 Spring 서버가 책임
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtGuard],
  exports: [JwtGuard, JwtModule],
})
export class AuthModule {}

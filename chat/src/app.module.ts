import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // Spring의 application.properties 역할 — 환경변수 로딩
    ConfigModule.forRoot({
      isGlobal: true, // 모든 모듈에서 별도 import 없이 사용 가능 (Spring @Value처럼)
      envFilePath: '.env',
    }),

    // Spring의 SecurityConfig + JwtTokenProvider 역할
    AuthModule,
    ChatModule,

    // Spring의 DataSource 설정 역할 — TypeORM은 JPA의 Node.js 대응
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        // entities는 각 모듈에서 TypeOrmModule.forFeature()로 등록
        autoLoadEntities: true,
        // 운영에서는 false — 스키마는 직접 DDL로 관리
        synchronize: false,
        ssl: config.get('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

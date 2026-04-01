import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://www.cohi-chat.com',
  'https://cohi-chat.com',
];

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const configService = app.get(ConfigService);
  const corsAllowedOrigins =
    configService
      .get<string>('APP_AUTH_CORS_ALLOWED_ORIGINS')
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? DEFAULT_ALLOWED_ORIGINS;

  app.enableCors({
    origin: corsAllowedOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('cohiChat 채팅 서버')
    .setDescription(
      '채팅 서버 API 문서. /api/chat/rooms 는 채팅방 목록을, /api/chat/rooms/{roomId}/messages 는 메시지 전송/조회 기능을 제공합니다.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwtAuth',
    )
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger-ui', app, swaggerDocument, {
    useGlobalPrefix: true,
  });

  await app.listen(Number(process.env.PORT) || 3001, '0.0.0.0');
}

void bootstrap();

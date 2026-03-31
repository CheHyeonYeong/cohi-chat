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

  // Spring 서버와 동일한 prefix 구조 유지. /health는 docker healthcheck용으로 제외
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Spring SwaggerConfig와 동일한 Bearer JWT 인증 스킴
  const config = new DocumentBuilder()
    .setTitle('cohiChat 채팅 서버')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwtAuth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Spring context-path /api 하위 swagger-ui와 동일한 경로
  SwaggerModule.setup('api/swagger-ui', app, document);

  await app.listen(Number(process.env.PORT) || 3001, '0.0.0.0');
}
bootstrap();

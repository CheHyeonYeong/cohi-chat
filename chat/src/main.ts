import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
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
  const configuredCorsAllowedOrigins =
    configService
      .get<string>('APP_AUTH_CORS_ALLOWED_ORIGINS')
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];
  const corsAllowedOrigins =
    configuredCorsAllowedOrigins.length > 0
      ? configuredCorsAllowedOrigins
      : DEFAULT_ALLOWED_ORIGINS;

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.enableCors({
    origin: corsAllowedOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('cohiChat chat server')
    .setDescription(
      'Chat server API docs for message history and send endpoints. Room list and read/unread ownership are handled in other branches.',
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

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
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
    .setTitle('cohiChat Chat API')
    .setDescription(
      'NestJS chat server for room list, message send, and message history APIs. Paste the Spring access token without the Bearer prefix into Swagger Authorize.',
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

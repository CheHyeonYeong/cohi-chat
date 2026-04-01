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

  const config = new DocumentBuilder()
    .setTitle('cohiChat Chat API')
    .setDescription(
      'NestJS chat server for sending messages and reading message history. In Swagger Authorize, paste only the Spring access token without the Bearer prefix.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'jwtAuth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/swagger-ui', app, document);

  await app.listen(Number(process.env.PORT) || 3001, '0.0.0.0');
}

void bootstrap();

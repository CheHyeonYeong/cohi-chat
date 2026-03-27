import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Spring 서버와 동일한 prefix 구조 유지
  app.setGlobalPrefix('api');

  // CORS — Spring의 corsAllowedOrigins와 동일하게 맞춤
  app.enableCors({
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') ?? [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true, // 쿠키 전달 허용 (Spring의 allowCredentials 대응)
  });

  await app.listen(Number(process.env.PORT) || 3001, '0.0.0.0');
}
bootstrap();

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

  // Spring 서버와 동일한 prefix 구조 유지. /health는 docker healthcheck용으로 제외
  app.setGlobalPrefix('api', { exclude: ['health'] });

  await app.listen(Number(process.env.PORT) || 3001, '0.0.0.0');
}
bootstrap();

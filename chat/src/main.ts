import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

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
  SwaggerModule.setup('swagger-ui', app, document);

  await app.listen(Number(process.env.PORT) || 3001, '0.0.0.0');
}
bootstrap();

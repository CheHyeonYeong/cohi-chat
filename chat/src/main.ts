import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const SWAGGER_TITLE =
  '\u0063\u006f\u0068\u0069\u0043\u0068\u0061\u0074 \uCC44\uD305 \uC11C\uBC84';
const SWAGGER_DESCRIPTION =
  '\uCC44\uD305 \uC11C\uBC84 API \uBB38\uC11C. GET /api/chat/rooms \uC751\uB2F5\uC5D0\uC11C lastMessage\uB294 \uBA54\uC2DC\uC9C0\uAC00 \uC5C6\uB294 \uBC29\uC5D0\uC11C null\uC785\uB2C8\uB2E4.';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.setGlobalPrefix('api', { exclude: ['health'] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription(SWAGGER_DESCRIPTION)
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

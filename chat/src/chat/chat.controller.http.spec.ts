import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { JwtGuard } from '../auth/jwt.guard';

describe('ChatController HTTP', () => {
  let app: NestFastifyApplication;
  let markRoomAsReadMock: jest.Mock;

  beforeEach(async () => {
    markRoomAsReadMock = jest.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: {
            getRooms: jest.fn(),
            markRoomAsRead: markRoomAsReadMock,
          },
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({
        canActivate: (context: Parameters<JwtGuard['canActivate']>[0]) => {
          const req = context.switchToHttp().getRequest();
          req.user = { sub: 'testuser' };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns 400 for an invalid roomId UUID before calling the service', async () => {
    await request(app.getHttpServer())
      .patch('/chat/rooms/not-a-uuid/read')
      .expect(400);

    expect(markRoomAsReadMock).not.toHaveBeenCalled();
  });
});

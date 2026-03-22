import { JwtPayload } from '../auth/jwt.guard';

// FastifyRequest에 user 필드 추가 — Spring의 SecurityContext에 인증 정보 담는 것과 동일
declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload;
  }
}

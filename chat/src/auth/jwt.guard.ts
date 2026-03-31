import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';

export interface JwtPayload {
  sub: string;   // Spring JWT subject = username
  role: 'GUEST' | 'HOST' | 'ADMIN';
}

// Spring의 JwtAuthenticationFilter에 대응
// NestJS Guard = Spring Filter/HandlerInterceptor의 인증 책임 부분
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('인증 토큰이 없습니다.');
    }

    try {
      // 알고리즘은 jjwt가 키 길이 기준으로 자동 선택하므로 제한하지 않음
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      // request.user에 주입 — Spring의 SecurityContextHolder.getContext().getAuthentication() 역할
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  private extractToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7);
  }
}

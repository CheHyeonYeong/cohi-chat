import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest } from 'fastify';

const ALLOWED_JWT_ALGORITHMS = ['HS256', 'HS384', 'HS512'] as const;

export interface JwtPayload {
  sub: string;
  role?: 'GUEST' | 'HOST' | 'ADMIN';
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('유효한 인증 토큰이 없습니다.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: [...ALLOWED_JWT_ALGORITHMS],
      });
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

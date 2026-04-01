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
  username?: string;
  role?: 'GUEST' | 'HOST' | 'ADMIN';
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing access token.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: [...ALLOWED_JWT_ALGORITHMS],
      });

      request.user = {
        ...payload,
        username: payload.username ?? payload.sub,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }
  }

  private extractToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.slice(7).trim();
  }
}

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';
import { JwtGuard } from './jwt.guard';

describe('JwtGuard', () => {
  const createContext = (request: FastifyRequest) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as never;

  it('verifies the token with the allowed HMAC algorithms and stores the payload', async () => {
    const verifyAsync = jest
      .fn()
      .mockResolvedValue({ sub: 'tester', role: 'GUEST' });
    const guard = new JwtGuard({ verifyAsync } as unknown as JwtService);
    const request = {
      headers: {
        authorization: 'Bearer token-value',
      },
    } as FastifyRequest;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(verifyAsync).toHaveBeenCalledWith('token-value', {
      algorithms: ['HS256', 'HS384', 'HS512'],
    });
    expect(request.user).toEqual({ sub: 'tester', role: 'GUEST' });
  });

  it('throws when the authorization header is missing', async () => {
    const guard = new JwtGuard({
      verifyAsync: jest.fn(),
    } as unknown as JwtService);
    const request = { headers: {} } as FastifyRequest;

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

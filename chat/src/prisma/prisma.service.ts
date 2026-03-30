import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super(PrismaService.createClientOptions());
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  private static resolveDatabaseUrl(): string | undefined {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return undefined;
    }

    if (process.env.NODE_ENV !== 'production') {
      return databaseUrl;
    }

    try {
      const url = new URL(databaseUrl);
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'require');
      }

      return url.toString();
    } catch {
      return databaseUrl;
    }
  }

  private static createClientOptions(): Prisma.PrismaClientOptions {
    const databaseUrl = PrismaService.resolveDatabaseUrl();
    if (!databaseUrl) {
      return {};
    }

    return {
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    };
  }
}

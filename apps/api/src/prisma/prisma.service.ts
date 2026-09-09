import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Saat test, error Prisma memang sengaja dipicu (uji constraint & 404),
    // jadi log dimatikan agar keluaran test tetap terbaca.
    const log: Array<'warn' | 'error'> =
      process.env.NODE_ENV === 'test'
        ? []
        : process.env.NODE_ENV === 'development'
          ? ['warn', 'error']
          : ['error'];

    super({ log });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
// @ts-ignore
import Redlock from 'redlock';

@Injectable()
export class RedlockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedlockService.name);
  private redisClient: Redis;
  public redlock: Redlock;

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redisClient = new Redis(redisUrl);
    
    this.redisClient.on('error', (err) => {
      this.logger.error('Redis error', err);
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redlock = new Redlock([this.redisClient], {
      driftFactor: 0.01,
      retryCount: 10,
      retryDelay: 200,
      retryJitter: 200,
      automaticExtensionThreshold: 500,
    });

    this.redlock.on('error', (err: any) => {
      this.logger.error('Redlock error', err);
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}

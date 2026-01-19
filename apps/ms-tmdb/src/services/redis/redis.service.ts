import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

/*Etablire la connection a redis
  ansi les operations cache get et set */
@Injectable()
export class RedisService implements OnModuleInit {
  private redisClient: Redis | null = null;
  private valable = false;
  // Creation du client redis a l'initialisation du module
  onModuleInit() {
    try {
      this.redisClient = new Redis({
        host: process.env.REDIS_HOST ?? 'redis',
        port: Number(process.env.REDIS_PORT ?? 6379),
      });

      this.redisClient.on('connect', () => {
        console.log('Redis connecté avec succès');
        this.valable = true;
      });

      this.redisClient.on('error', (e) => {
        console.error('Redis error:', e);
        this.valable = false;
        this.redisClient = null;
      });
    } catch (e) {
      console.error('Erreur de connexion à Redis:', e);
      this.valable = false;
      this.redisClient = null;
    }
  }

  /**
   * Récupère une valeur depuis Redis.
   * @param key - clé du cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redisClient) {
      return null;
    }
    const data = await this.redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  /**
   * Sauvegarde une valeur dans Redis.
   * @param key - clé du cache
   * @param value - données à enregistrer
   * @param ttl - durée de vie en secondes
   */
  async set(key: string, value: unknown, ttl = 7200): Promise<void> {
    if (!this.redisClient) {
      return;
    }
    await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl);
  }
}

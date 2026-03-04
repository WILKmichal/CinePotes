import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

// Service Redis central:
// initialise une connexion Redis au démarrage du module
// expose des helpers de cache génériques (get/set JSON)
@Injectable()
export class RedisService implements OnModuleInit {
  private redisClient: Redis | null = null;
  // Indicateur de validité de connexion (utilisable pour debug/supervision)
  private valable = false;

  /* Hook NestJS appelé automatiquement après l'instanciation du provider.
   * Traitement:
   * crée le client Redis à partir des variables d'environnement
   * écoute les événements "connect" et "error"
   * met à jour l'état interne selon la connexion
   */
  onModuleInit() {
    try {
      this.redisClient = new Redis({
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      });

      // Quand Redis est joignable, on marque le service comme valide.
      this.redisClient.on('connect', () => {
        console.log('Redis connecté avec succès');
        this.valable = true;
      });

      // En cas d'erreur réseau/protocole, on invalide le client pour éviter
      // les usages suivants tant qu'une nouvelle instance n'est pas créée.
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
    // Traitement:
    // si Redis indisponible => null (fallback silencieux)
    // lit la valeur brute
    // désérialise JSON vers le type attendu T
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
    // Traitement:
    // si Redis indisponible => no-op
    // sérialise la valeur en JSON
    // enregistre avec expiration TTL (EX)
    if (!this.redisClient) {
      return;
    }
    await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl);
  }
}

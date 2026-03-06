import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { LibraryModule } from './services/ms-library/library.module';
import { RedisModule } from './services/redis/redis.module';
import { ApiModule } from './api.module';
import { envValidationSchema } from './config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/ms-library/.env', '.env'],
      validationSchema: envValidationSchema,
    }),
    ApiModule,
    LibraryModule,
    RedisModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

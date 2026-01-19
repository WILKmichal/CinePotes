import { Module } from '@nestjs/common';
import { TmdbController } from './tmdb.controller';
import { ConfigModule } from '@nestjs/config';
import { TmdbMsClient } from './tmdb-ms.client';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [TmdbController],
  providers: [TmdbMsClient],
})
export class TmdbModule {}

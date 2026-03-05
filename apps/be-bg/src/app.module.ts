import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TestController } from './test.controller';
import { AuthModule } from './auth/auth.module';
import { SeancesModule } from './seances/seances.module';
import { ListsModule } from './lists/lists.module';
import { NatsModule } from './nats/nats.module';
import { NatsExempleController } from './nats/nats-exemple.controller';
import { LibraryModule } from './services/library/library.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    LibraryModule,
    AuthModule,
    SeancesModule,
    ListsModule,
    NatsModule,
  ],
  controllers: [AppController, TestController, NatsExempleController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

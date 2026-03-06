import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SeancesModule } from './seances/seances.module';
import { ListsModule } from './lists/lists.module';
import { NatsModule } from './nats/nats.module';
import { LibraryModule } from './services/library/library.module';
import { envValidationSchema } from './config.validation';
import { RequestIdMiddleware } from './middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/be-bg/.env', '.env'],
      validationSchema: envValidationSchema,
    }),
    LibraryModule,
    AuthModule,
    SeancesModule,
    ListsModule,
    NatsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

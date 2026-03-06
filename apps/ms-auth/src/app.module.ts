import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { HealthController } from "./health.controller";
import { envValidationSchema } from "./config.validation";

// TypeORM a besoin de TOUTES les entités liées par des relations,
// même si ms-auth n'écrit que dans User.
// (Même pattern que ms-sessions dans ce projet)
import { User } from "schemas/user.entity";
import { Seance } from "schemas/seance.entity";
import { Participant } from "schemas/participant.entity";
import { Liste } from "schemas/liste.entity";
import { ListeFilm } from "schemas/liste-film.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["apps/ms-auth/.env", ".env"],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres" as const,
        host: configService.getOrThrow<string>("DB_HOST"),
        port: configService.getOrThrow<number>("DB_PORT"),
        username: configService.getOrThrow<string>("DB_USER"),
        password: configService.getOrThrow<string>("DB_PASSWORD"),
        database: configService.getOrThrow<string>("DB_NAME"),
        entities: [User, Seance, Participant, Liste, ListeFilm],
        synchronize: false,
      }),
    }),
    ClientsModule.registerAsync([
      {
        name: "NATS_SERVICE",
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [configService.getOrThrow<string>("NATS_URL")],
          },
        }),
      },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

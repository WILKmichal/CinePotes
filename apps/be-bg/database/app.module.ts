
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UsersModule } from 'users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port:  Number.parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'example',
      database: process.env.DB_NAME || 'mydatabase',
      entities: [],
      synchronize: true,
    }),
    UsersModule,
  ],    
})
export class AppModule {
    constructor(private dataSource: DataSource) {}
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CuadrillasModule } from './cuadrillas/cuadrillas.module';
import { ReportesModule } from './reportes/reportes.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'db',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME ?? 'baches',
      password: process.env.DB_PASSWORD ?? 'baches123',
      database: process.env.DB_DATABASE ?? 'sistema_baches',
      autoLoadEntities: true,
      synchronize: true,
    }),

    UsuariosModule,
    AuthModule,
    CuadrillasModule,
    ReportesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

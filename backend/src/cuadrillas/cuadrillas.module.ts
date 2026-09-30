import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Cuadrilla } from './cuadrilla.entity';
import { CuadrillasController } from './cuadrillas.controller';
import { CuadrillasService } from './cuadrillas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cuadrilla,
    ]),
    AuthModule,
  ],
  controllers: [
    CuadrillasController,
  ],
  providers: [
    CuadrillasService,
  ],
  exports: [
    CuadrillasService,
  ],
})
export class CuadrillasModule {}

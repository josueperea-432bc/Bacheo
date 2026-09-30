import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Cuadrilla } from '../cuadrillas/cuadrilla.entity';
import { ReporteEvidencia } from './evidencias/reporte-evidencia.entity';
import { Reporte } from './reporte.entity';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reporte,
      Cuadrilla,
      ReporteEvidencia,
    ]),
    AuthModule,
  ],
  controllers: [ReportesController],
  providers: [ReportesService],
  exports: [ReportesService],
})
export class ReportesModule {}

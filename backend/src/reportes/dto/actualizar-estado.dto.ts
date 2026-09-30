import { IsEnum } from 'class-validator';
import { EstadoReporte } from '../reporte.entity';

export class ActualizarEstadoDto {
  @IsEnum(EstadoReporte)
  estado: EstadoReporte;
}

import {
  IsEmail,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SeveridadReporte } from '../reporte.entity';

export class CrearReporteDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  correo?: string;

  @IsOptional()
  @IsLatitude()
  latitud?: number;

  @IsOptional()
  @IsLongitude()
  longitud?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  calle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  entreCalles?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  colonia?: string;

  @IsString()
  @MaxLength(250)
  descripcion: string;

  @IsEnum(SeveridadReporte)
  severidad: SeveridadReporte;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fotografia?: string;
}

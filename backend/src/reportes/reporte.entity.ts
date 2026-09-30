import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cuadrilla } from '../cuadrillas/cuadrilla.entity';
import { ReporteEvidencia } from './evidencias/reporte-evidencia.entity';

export enum SeveridadReporte {
  ALTA = 'Alta',
  MEDIA = 'Media',
  BAJA = 'Baja',
}

export enum EstadoReporte {
  REPORTADO = 'Reportado',
  EN_PROCESO = 'En Proceso',
  ATENDIDO = 'Atendido',
}

@Entity('reportes')
export class Reporte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 30,
    unique: true,
  })
  folio: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  telefono: string | null;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  correo: string | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitud: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitud: number | null;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  calle: string | null;

  @Column({
    name: 'entre_calles',
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  entreCalles: string | null;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  colonia: string | null;

  @Column({
    type: 'varchar',
    length: 250,
  })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: SeveridadReporte,
    default: SeveridadReporte.MEDIA,
  })
  severidad: SeveridadReporte;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  fotografia: string | null;

  @Column({
    type: 'enum',
    enum: EstadoReporte,
    default: EstadoReporte.REPORTADO,
  })
  estado: EstadoReporte;

  @CreateDateColumn({
    name: 'fecha_reporte',
    type: 'timestamp',
  })
  fechaReporte: Date;

  @Column({
    name: 'fecha_atencion',
    type: 'timestamp',
    nullable: true,
  })
  fechaAtencion: Date | null;

  @ManyToOne(
    () => Cuadrilla,
    (cuadrilla) => cuadrilla.reportes,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'cuadrilla_id',
  })
  cuadrilla: Cuadrilla | null;

  @OneToMany(
    () => ReporteEvidencia,
    (evidencia) => evidencia.reporte,
  )
  evidencias: ReporteEvidencia[];
}

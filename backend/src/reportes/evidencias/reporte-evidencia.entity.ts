import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reporte } from '../reporte.entity';
import { Usuario } from '../../usuarios/usuario.entity';

export enum TipoEvidencia {
  DANIO = 'Danio',
  REPARACION = 'Reparacion',
}

@Entity('reporte_evidencias')
export class ReporteEvidencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'reporte_id',
    type: 'int',
  })
  reporteId: number;

  @Column({
    type: 'enum',
    enum: TipoEvidencia,
  })
  tipo: TipoEvidencia;

  @Column({
    type: 'varchar',
    length: 255,
  })
  ruta: string;

  @Column({
    name: 'subido_por',
    type: 'int',
    nullable: true,
  })
  subidoPor: number | null;

  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'timestamp',
    precision: 6,
  })
  fechaCreacion: Date;

  @ManyToOne(
    () => Reporte,
    (reporte) => reporte.evidencias,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'reporte_id',
  })
  reporte: Reporte;

  @ManyToOne(
    () => Usuario,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({
    name: 'subido_por',
  })
  usuario: Usuario | null;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Reporte } from '../reportes/reporte.entity';

@Entity('cuadrillas')
export class Cuadrilla {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 120,
  })
  nombre: string;

  @Column({
    type: 'varchar',
    length: 150,
  })
  responsable: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  telefono: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  activo: boolean;

  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'timestamp',
    precision: 6,
  })
  fechaCreacion: Date;

  @OneToMany(
    () => Reporte,
    (reporte) => reporte.cuadrilla,
  )
  reportes: Reporte[];
}

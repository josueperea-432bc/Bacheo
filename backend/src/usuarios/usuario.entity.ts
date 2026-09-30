import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum RolUsuario {
  ADMINISTRADOR = 'Administrador',
  REVISOR = 'Revisor',
  CUADRILLA = 'Cuadrilla',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 150,
  })
  nombre: string;

  @Column({
    type: 'varchar',
    length: 80,
    unique: true,
  })
  usuario: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    select: false,
  })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.REVISOR,
  })
  rol: RolUsuario;

  @Column({
    name: 'cuadrilla_id',
    type: 'int',
    nullable: true,
  })
  cuadrillaId: number | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  activo: boolean;

  @CreateDateColumn({
    name: 'fecha_creacion',
    type: 'timestamp',
  })
  fechaCreacion: Date;
}

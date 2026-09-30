import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuadrilla } from './cuadrilla.entity';

@Injectable()
export class CuadrillasService {
  constructor(
    @InjectRepository(Cuadrilla)
    private readonly cuadrillasRepository:
      Repository<Cuadrilla>,
  ) {}

  listar(): Promise<Cuadrilla[]> {
    return this.cuadrillasRepository.find({
      where: {
        activo: true,
      },
      order: {
        nombre: 'ASC',
      },
    });
  }

  crear(datos: {
    nombre: string;
    responsable: string;
    telefono?: string;
  }): Promise<Cuadrilla> {
    const cuadrilla =
      this.cuadrillasRepository.create({
        nombre: datos.nombre.trim(),
        responsable: datos.responsable.trim(),
        telefono:
          datos.telefono?.trim() || null,
        activo: true,
      });

    return this.cuadrillasRepository.save(
      cuadrilla,
    );
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    const nombre = datos.nombre?.trim();
    const responsable =
      datos.responsable?.trim();

    if (!nombre || !responsable) {
      throw new BadRequestException(
        'El nombre y el responsable son obligatorios.',
      );
    }

    const cuadrilla =
      this.cuadrillasRepository.create({
        nombre,
        responsable,
        telefono:
          datos.telefono?.trim() || null,
        activo: true,
      });

    return this.cuadrillasRepository.save(
      cuadrilla,
    );
  }

  async actualizar(
    id: number,
    datos: {
      nombre: string;
      responsable: string;
      telefono?: string;
    },
  ): Promise<Cuadrilla> {
    const cuadrilla =
      await this.cuadrillasRepository.findOne({
        where: {
          id,
        },
      });

    if (!cuadrilla) {
      throw new NotFoundException(
        'La cuadrilla no existe.',
      );
    }

    if (!cuadrilla.activo) {
      throw new BadRequestException(
        'La cuadrilla se encuentra inactiva.',
      );
    }

    const nombre =
      datos.nombre?.trim();

    const responsable =
      datos.responsable?.trim();

    if (!nombre || !responsable) {
      throw new BadRequestException(
        'El nombre y el responsable son obligatorios.',
      );
    }

    cuadrilla.nombre =
      nombre;

    cuadrilla.responsable =
      responsable;

    cuadrilla.telefono =
      datos.telefono?.trim() || null;

    return this.cuadrillasRepository.save(
      cuadrilla,
    );
  }

  async darDeBaja(
    id: number,
  ): Promise<{
    mensaje: string;
    id: number;
  }> {
    const cuadrilla =
      await this.cuadrillasRepository.findOne({
        where: {
          id,
        },
      });

    if (!cuadrilla) {
      throw new NotFoundException(
        'La cuadrilla no existe.',
      );
    }

    cuadrilla.activo = false;

    await this.cuadrillasRepository.save(
      cuadrilla,
    );

    return {
      mensaje:
        'La cuadrilla fue eliminada correctamente.',
      id: cuadrilla.id,
    };
  }
}

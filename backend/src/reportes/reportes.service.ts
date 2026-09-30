import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Cuadrilla } from '../cuadrillas/cuadrilla.entity';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';
import { CrearReporteDto } from './dto/crear-reporte.dto';
import {
  ReporteEvidencia,
  TipoEvidencia,
} from './evidencias/reporte-evidencia.entity';
import {
  EstadoReporte,
  Reporte,
} from './reporte.entity';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Reporte)
    private readonly reportesRepository:
      Repository<Reporte>,

    @InjectRepository(Cuadrilla)
    private readonly cuadrillasRepository:
      Repository<Cuadrilla>,

    @InjectRepository(ReporteEvidencia)
    private readonly evidenciasRepository:
      Repository<ReporteEvidencia>,
  ) {}

  async crear(
    datos: CrearReporteDto,
  ): Promise<Reporte> {
    const tieneGps =
      datos.latitud !== undefined &&
      datos.longitud !== undefined;

    const tieneDireccion =
      Boolean(datos.calle?.trim()) &&
      Boolean(datos.colonia?.trim());

    if (!tieneGps && !tieneDireccion) {
      throw new BadRequestException(
        'Debe proporcionar la ubicación mediante GPS o indicar calle y colonia.',
      );
    }

    const folioTemporal =
      `TMP-${randomUUID()
        .replace(/-/g, '')
        .slice(0, 20)}`;

    const reporte =
      this.reportesRepository.create({
        ...datos,
        folio: folioTemporal,
        estado: EstadoReporte.REPORTADO,
        telefono: datos.telefono ?? null,
        correo: datos.correo ?? null,
        latitud: datos.latitud ?? null,
        longitud: datos.longitud ?? null,
        calle: datos.calle ?? null,
        entreCalles:
          datos.entreCalles ?? null,
        colonia: datos.colonia ?? null,
        fotografia:
          datos.fotografia ?? null,
        fechaAtencion: null,
        cuadrilla: null,
      });

    const guardado =
      await this.reportesRepository.save(
        reporte,
      );

    const anio =
      new Date().getFullYear();

    guardado.folio =
      `BCH-${anio}-${String(
        guardado.id,
      ).padStart(4, '0')}`;

    return this.reportesRepository.save(
      guardado,
    );
  }

  listarTodos(): Promise<Reporte[]> {
    return this.reportesRepository.find({
      relations: {
        cuadrilla: true,
        evidencias: true,
      },
      order: {
        fechaReporte: 'DESC',
      },
    });
  }

  async buscarPorFolio(
    folio: string,
  ): Promise<Reporte> {
    const reporte =
      await this.reportesRepository.findOne({
        where: {
          folio: folio.toUpperCase(),
        },
        relations: {
          cuadrilla: true,
          evidencias: true,
        },
      });

    if (!reporte) {
      throw new NotFoundException(
        'No se encontró un reporte con ese folio.',
      );
    }

    return reporte;
  }

  async buscarPorId(
    id: number,
  ): Promise<Reporte> {
    const reporte =
      await this.reportesRepository.findOne({
        where: { id },
        relations: {
          cuadrilla: true,
          evidencias: true,
        },
      });

    if (!reporte) {
      throw new NotFoundException(
        'El reporte no existe.',
      );
    }

    return reporte;
  }

  async asignarCuadrilla(
    reporteId: number,
    cuadrillaId: number,
  ): Promise<Reporte> {
    const reporte =
      await this.buscarPorId(
        reporteId,
      );

    const cuadrilla =
      await this.cuadrillasRepository.findOne({
        where: {
          id: cuadrillaId,
          activo: true,
        },
      });

    if (!cuadrilla) {
      throw new NotFoundException(
        'La cuadrilla seleccionada no existe o se encuentra inactiva.',
      );
    }

    reporte.cuadrilla = cuadrilla;

    if (
      reporte.estado ===
      EstadoReporte.REPORTADO
    ) {
      reporte.estado =
        EstadoReporte.EN_PROCESO;
    }

    await this.reportesRepository.save(
      reporte,
    );

    return this.buscarPorId(
      reporte.id,
    );
  }

  async registrarEvidencia(
    reporteId: number,
    tipo: TipoEvidencia,
    ruta: string,
    subidoPor: number | null = null,
  ): Promise<ReporteEvidencia> {
    await this.buscarPorId(
      reporteId,
    );

    const evidencia =
      this.evidenciasRepository.create({
        reporteId,
        tipo,
        ruta,
        subidoPor,
      });

    return this.evidenciasRepository.save(
      evidencia,
    );
  }

  obtenerEvidencias(
    reporteId: number,
  ): Promise<ReporteEvidencia[]> {
    return this.evidenciasRepository.find({
      where: {
        reporteId,
      },
      relations: {
        usuario: true,
      },
      order: {
        fechaCreacion: 'ASC',
      },
    });
  }

  async terminarReporte(
    reporteId: number,
  ): Promise<Reporte> {
    const reporte =
      await this.buscarPorId(
        reporteId,
      );

    if (!reporte.cuadrilla) {
      throw new BadRequestException(
        'El reporte debe tener una cuadrilla asignada antes de finalizarse.',
      );
    }

    const fotosReparacion =
      await this.evidenciasRepository.count({
        where: {
          reporteId,
          tipo: TipoEvidencia.REPARACION,
        },
      });

    if (fotosReparacion === 0) {
      throw new BadRequestException(
        'Debe registrar al menos una fotografía de la reparación antes de terminar el reporte.',
      );
    }

    reporte.estado =
      EstadoReporte.ATENDIDO;

    reporte.fechaAtencion =
      new Date();

    await this.reportesRepository.save(
      reporte,
    );

    return this.buscarPorId(
      reporte.id,
    );
  }

  async actualizarEstado(
    id: number,
    datos: ActualizarEstadoDto,
  ): Promise<Reporte> {
    const reporte =
      await this.buscarPorId(id);

    if (
      datos.estado ===
      EstadoReporte.ATENDIDO
    ) {
      return this.terminarReporte(
        id,
      );
    }

    reporte.estado =
      datos.estado;

    reporte.fechaAtencion =
      null;

    await this.reportesRepository.save(
      reporte,
    );

    return this.buscarPorId(
      reporte.id,
    );
  }

  listarPorCuadrilla(
    cuadrillaId: number,
  ): Promise<Reporte[]> {
    return this.reportesRepository.find({
      where: {
        cuadrilla: {
          id: cuadrillaId,
        },
      },
      relations: {
        cuadrilla: true,
        evidencias: true,
      },
      order: {
        fechaReporte: 'DESC',
      },
    });
  }}


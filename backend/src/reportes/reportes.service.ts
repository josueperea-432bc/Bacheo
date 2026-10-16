import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import {
  In,
  Repository,
} from 'typeorm';
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
  SeveridadReporte,
} from './reporte.entity';

interface ReporteCiudadanoGrupo {
  id: number;
  folio: string;
  descripcion: string;
  fotografia: string | null;
  fechaReporte: Date;
  severidad: SeveridadReporte;
}

export interface ReporteAgrupado
  extends Reporte {
  cantidadReportes: number;

  reportesCiudadanos:
    ReporteCiudadanoGrupo[];
}

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

  private normalizarTexto(
    valor?: string | null,
  ): string {
    return (valor ?? '')
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        '',
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]/g,
        '',
      );
  }

  private tieneCoordenadas(
    reporte: {
      latitud?: number | string | null;
      longitud?: number | string | null;
    },
  ): boolean {
    const latitud =
      Number(reporte.latitud);

    const longitud =
      Number(reporte.longitud);

    return (
      reporte.latitud !== null &&
      reporte.latitud !== undefined &&
      reporte.longitud !== null &&
      reporte.longitud !== undefined &&
      Number.isFinite(latitud) &&
      Number.isFinite(longitud)
    );
  }

  private distanciaMetros(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const radioTierra =
      6371000;

    const radianes = (
      grados: number,
    ) =>
      grados *
      (Math.PI / 180);

    const dLat =
      radianes(
        lat2 - lat1,
      );

    const dLon =
      radianes(
        lon2 - lon1,
      );

    const a =
      Math.sin(
        dLat / 2,
      ) ** 2 +
      Math.cos(
        radianes(lat1),
      ) *
        Math.cos(
          radianes(lat2),
        ) *
        Math.sin(
          dLon / 2,
        ) ** 2;

    return (
      2 *
      radioTierra *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a),
      )
    );
  }

  private mismoCiclo(
    primero: Reporte,
    segundo: Reporte,
  ): boolean {
    const primeroAtendido =
      primero.estado ===
      EstadoReporte.ATENDIDO;

    const segundoAtendido =
      segundo.estado ===
      EstadoReporte.ATENDIDO;

    if (
      primeroAtendido !==
      segundoAtendido
    ) {
      return false;
    }

    const diferencia =
      Math.abs(
        new Date(
          primero.fechaReporte,
        ).getTime() -
          new Date(
            segundo.fechaReporte,
          ).getTime(),
      );

    const dias =
      diferencia /
      (1000 * 60 * 60 * 24);

    return dias <= 180;
  }

  private mismaUbicacion(
    primero: Reporte,
    segundo: Reporte,
  ): boolean {
    if (
      primero.id ===
      segundo.id
    ) {
      return true;
    }

    if (
      !this.mismoCiclo(
        primero,
        segundo,
      )
    ) {
      return false;
    }

    if (
      this.tieneCoordenadas(
        primero,
      ) &&
      this.tieneCoordenadas(
        segundo,
      )
    ) {
      const distancia =
        this.distanciaMetros(
          Number(
            primero.latitud,
          ),
          Number(
            primero.longitud,
          ),
          Number(
            segundo.latitud,
          ),
          Number(
            segundo.longitud,
          ),
        );

      return distancia <= 20;
    }

    const callePrimero =
      this.normalizarTexto(
        primero.calle,
      );

    const calleSegundo =
      this.normalizarTexto(
        segundo.calle,
      );

    const coloniaPrimero =
      this.normalizarTexto(
        primero.colonia,
      );

    const coloniaSegundo =
      this.normalizarTexto(
        segundo.colonia,
      );

    if (
      !callePrimero ||
      !calleSegundo ||
      !coloniaPrimero ||
      !coloniaSegundo
    ) {
      return false;
    }

    if (
      callePrimero !==
        calleSegundo ||
      coloniaPrimero !==
        coloniaSegundo
    ) {
      return false;
    }

    const entrePrimero =
      this.normalizarTexto(
        primero.entreCalles,
      );

    const entreSegundo =
      this.normalizarTexto(
        segundo.entreCalles,
      );

    if (
      !entrePrimero &&
      !entreSegundo
    ) {
      return true;
    }

    return (
      entrePrimero ===
      entreSegundo
    );
  }

  private mismaUbicacionDatos(
    datos: CrearReporteDto,
    reporte: Reporte,
  ): boolean {
    if (
      reporte.estado ===
      EstadoReporte.ATENDIDO
    ) {
      return false;
    }

    if (
      datos.latitud !== undefined &&
      datos.longitud !== undefined &&
      this.tieneCoordenadas(
        reporte,
      )
    ) {
      return (
        this.distanciaMetros(
          Number(
            datos.latitud,
          ),
          Number(
            datos.longitud,
          ),
          Number(
            reporte.latitud,
          ),
          Number(
            reporte.longitud,
          ),
        ) <= 20
      );
    }

    const calleNueva =
      this.normalizarTexto(
        datos.calle,
      );

    const calleExistente =
      this.normalizarTexto(
        reporte.calle,
      );

    const coloniaNueva =
      this.normalizarTexto(
        datos.colonia,
      );

    const coloniaExistente =
      this.normalizarTexto(
        reporte.colonia,
      );

    if (
      !calleNueva ||
      !calleExistente ||
      !coloniaNueva ||
      !coloniaExistente
    ) {
      return false;
    }

    if (
      calleNueva !==
        calleExistente ||
      coloniaNueva !==
        coloniaExistente
    ) {
      return false;
    }

    const entreNueva =
      this.normalizarTexto(
        datos.entreCalles,
      );

    const entreExistente =
      this.normalizarTexto(
        reporte.entreCalles,
      );

    if (
      !entreNueva &&
      !entreExistente
    ) {
      return true;
    }

    return (
      entreNueva ===
      entreExistente
    );
  }

  private pesoEstado(
    estado: EstadoReporte,
  ): number {
    switch (estado) {
      case EstadoReporte.ATENDIDO:
        return 3;

      case EstadoReporte.EN_PROCESO:
        return 2;

      default:
        return 1;
    }
  }

  private pesoSeveridad(
    severidad: SeveridadReporte,
  ): number {
    switch (severidad) {
      case SeveridadReporte.ALTA:
        return 3;

      case SeveridadReporte.MEDIA:
        return 2;

      default:
        return 1;
    }
  }

  private agruparReportes(
    reportes: Reporte[],
  ): ReporteAgrupado[] {
    const ordenados =
      [...reportes].sort(
        (a, b) =>
          a.id - b.id,
      );

    const usados =
      new Set<number>();

    const agrupados:
      ReporteAgrupado[] = [];

    for (
      const base of ordenados
    ) {
      if (
        usados.has(
          base.id,
        )
      ) {
        continue;
      }

      const grupo =
        ordenados.filter(
          (candidato) =>
            !usados.has(
              candidato.id,
            ) &&
            this.mismaUbicacion(
              base,
              candidato,
            ),
        );

      grupo.forEach(
        (reporte) =>
          usados.add(
            reporte.id,
          ),
      );

      const representante =
        grupo[0];

      const estado =
        grupo.reduce(
          (
            actual,
            reporte,
          ) =>
            this.pesoEstado(
              reporte.estado,
            ) >
            this.pesoEstado(
              actual,
            )
              ? reporte.estado
              : actual,
          representante.estado,
        );

      const severidad =
        grupo.length >= 4
          ? SeveridadReporte.ALTA
          : grupo.length >= 2
            ? SeveridadReporte.MEDIA
            : SeveridadReporte.BAJA;

      const cuadrilla =
        grupo.find(
          (reporte) =>
            Boolean(
              reporte.cuadrilla,
            ),
        )?.cuadrilla ??
        null;

      const evidencias =
        grupo
          .flatMap(
            (reporte) =>
              reporte.evidencias ??
              [],
          )
          .sort(
            (a, b) =>
              new Date(
                a.fechaCreacion,
              ).getTime() -
              new Date(
                b.fechaCreacion,
              ).getTime(),
          );

      const reportesCiudadanos =
        grupo.map(
          (reporte) => ({
            id:
              reporte.id,

            folio:
              reporte.folio,

            descripcion:
              reporte.descripcion,

            fotografia:
              reporte.fotografia,

            fechaReporte:
              reporte.fechaReporte,

            severidad:
              reporte.severidad,
          }),
        );

      agrupados.push({
        ...representante,

        estado,

        severidad,

        cuadrilla,

        evidencias,

        cantidadReportes:
          grupo.length,

        reportesCiudadanos,
      });
    }

    return agrupados.sort(
      (a, b) => {
        const ultimaA =
          Math.max(
            ...a.reportesCiudadanos.map(
              (reporte) =>
                new Date(
                  reporte.fechaReporte,
                ).getTime(),
            ),
          );

        const ultimaB =
          Math.max(
            ...b.reportesCiudadanos.map(
              (reporte) =>
                new Date(
                  reporte.fechaReporte,
                ).getTime(),
            ),
          );

        return (
          ultimaB -
          ultimaA
        );
      },
    );
  }

  private async buscarRelacionados(
    reporte: Reporte,
  ): Promise<Reporte[]> {
    const todos =
      await this.reportesRepository.find({
        relations: {
          cuadrilla: true,
          evidencias: true,
        },
      });

    const relacionados =
      todos.filter(
        (candidato) =>
          this.mismaUbicacion(
            reporte,
            candidato,
          ),
      );

    return (
      relacionados.length > 0
        ? relacionados
        : [reporte]
    );
  }

  async crear(
    datos: CrearReporteDto,
  ): Promise<Reporte> {
    const tieneGps =
      datos.latitud !== undefined &&
      datos.longitud !== undefined;

    const tieneDireccion =
      Boolean(
        datos.calle?.trim(),
      ) &&
      Boolean(
        datos.colonia?.trim(),
      );

    if (
      !tieneGps &&
      !tieneDireccion
    ) {
      throw new BadRequestException(
        'Debe proporcionar la ubicación mediante GPS o indicar calle y colonia.',
      );
    }

    const folioTemporal =
      `TMP-${randomUUID()
        .replace(
          /-/g,
          '',
        )
        .slice(
          0,
          20,
        )}`;

    const reporte =
      this.reportesRepository.create({
        ...datos,

        folio:
          folioTemporal,

        estado:
          EstadoReporte.REPORTADO,

        severidad:
          SeveridadReporte.BAJA,

        telefono:
          datos.telefono ??
          null,

        correo:
          datos.correo ??
          null,

        latitud:
          datos.latitud ??
          null,

        longitud:
          datos.longitud ??
          null,

        calle:
          datos.calle ??
          null,

        entreCalles:
          datos.entreCalles ??
          null,

        colonia:
          datos.colonia ??
          null,

        fotografia:
          datos.fotografia ??
          null,

        fechaAtencion:
          null,

        cuadrilla:
          null,
      });

    const guardado =
      await this.reportesRepository.save(
        reporte,
      );

    const activos =
      await this.reportesRepository.find({
        where: [
          {
            estado:
              EstadoReporte.REPORTADO,
          },
          {
            estado:
              EstadoReporte.EN_PROCESO,
          },
        ],

        relations: {
          cuadrilla: true,
        },
      });

    const similar =
      activos.find(
        (existente) =>
          existente.id !==
            guardado.id &&
          this.mismaUbicacionDatos(
            datos,
            existente,
          ),
      );

    if (similar) {
      guardado.estado =
        similar.estado;

      guardado.cuadrilla =
        similar.cuadrilla ??
        null;
    }

    const anio =
      new Date().getFullYear();

    guardado.folio =
      `BCH-${anio}-${String(
        guardado.id,
      ).padStart(
        4,
        '0',
      )}`;

    return this.reportesRepository.save(
      guardado,
    );
  }

  async listarTodos():
    Promise<ReporteAgrupado[]> {
    const reportes =
      await this.reportesRepository.find({
        relations: {
          cuadrilla: true,
          evidencias: true,
        },

        order: {
          fechaReporte:
            'DESC',
        },
      });

    return this.agruparReportes(
      reportes,
    );
  }

  async buscarPorFolio(
    folio: string,
  ): Promise<Reporte> {
    const reporte =
      await this.reportesRepository.findOne({
        where: {
          folio:
            folio.toUpperCase(),
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
        where: {
          id,
        },

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
          id:
            cuadrillaId,

          activo:
            true,
        },
      });

    if (!cuadrilla) {
      throw new NotFoundException(
        'La cuadrilla seleccionada no existe o se encuentra inactiva.',
      );
    }

    const relacionados =
      await this.buscarRelacionados(
        reporte,
      );

    relacionados.forEach(
      (relacionado) => {
        relacionado.cuadrilla =
          cuadrilla;

        if (
          relacionado.estado ===
          EstadoReporte.REPORTADO
        ) {
          relacionado.estado =
            EstadoReporte.EN_PROCESO;
        }
      },
    );

    await this.reportesRepository.save(
      relacionados,
    );

    return this.buscarPorId(
      reporte.id,
    );
  }

  async registrarEvidencia(
    reporteId: number,
    tipo: TipoEvidencia,
    ruta: string,
    subidoPor:
      number | null = null,
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
        fechaCreacion:
          'ASC',
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

    const relacionados =
      await this.buscarRelacionados(
        reporte,
      );

    const tieneCuadrilla =
      relacionados.some(
        (relacionado) =>
          Boolean(
            relacionado.cuadrilla,
          ),
      );

    if (!tieneCuadrilla) {
      throw new BadRequestException(
        'El reporte debe tener una cuadrilla asignada antes de finalizarse.',
      );
    }

    const ids =
      relacionados.map(
        (relacionado) =>
          relacionado.id,
      );

    const fotosReparacion =
      await this.evidenciasRepository.count({
        where: {
          reporteId:
            In(ids),

          tipo:
            TipoEvidencia.REPARACION,
        },
      });

    if (
      fotosReparacion === 0
    ) {
      throw new BadRequestException(
        'Debe registrar al menos una fotografía de la reparación antes de terminar el reporte.',
      );
    }

    const fecha =
      new Date();

    relacionados.forEach(
      (relacionado) => {
        relacionado.estado =
          EstadoReporte.ATENDIDO;

        relacionado.fechaAtencion =
          fecha;
      },
    );

    await this.reportesRepository.save(
      relacionados,
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
      await this.buscarPorId(
        id,
      );

    if (
      datos.estado ===
      EstadoReporte.ATENDIDO
    ) {
      return this.terminarReporte(
        id,
      );
    }

    const relacionados =
      await this.buscarRelacionados(
        reporte,
      );

    relacionados.forEach(
      (relacionado) => {
        relacionado.estado =
          datos.estado;

        relacionado.fechaAtencion =
          null;
      },
    );

    await this.reportesRepository.save(
      relacionados,
    );

    return this.buscarPorId(
      reporte.id,
    );
  }

  async listarPorCuadrilla(
    cuadrillaId: number,
  ): Promise<ReporteAgrupado[]> {
    const reportes =
      await this.reportesRepository.find({
        where: {
          cuadrilla: {
            id:
              cuadrillaId,
          },
        },

        relations: {
          cuadrilla: true,
          evidencias: true,
        },

        order: {
          fechaReporte:
            'DESC',
        },
      });

    return this.agruparReportes(
      reportes,
    );
  }
}

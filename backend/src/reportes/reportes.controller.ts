import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { AuthGuard } from '../auth/auth.guard';
import { ActualizarEstadoDto } from './dto/actualizar-estado.dto';
import { CrearReporteDto } from './dto/crear-reporte.dto';
import { TipoEvidencia } from './evidencias/reporte-evidencia.entity';
import { ReportesService } from './reportes.service';

interface UsuarioToken {
  sub: number;
  usuario: string;
  rol: string;
  cuadrillaId: number | null;
}

const tiposPermitidos = [
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const filtroImagen = (
  _req: unknown,
  file: Express.Multer.File,
  callback: (
    error: Error | null,
    acceptFile: boolean,
  ) => void,
) => {
  if (!tiposPermitidos.includes(file.mimetype)) {
    return callback(
      new Error(
        'Solo se permiten imágenes JPG, JPEG o PNG.',
      ),
      false,
    );
  }

  callback(null, true);
};

@Controller('reportes')
export class ReportesController {
  constructor(
    private readonly reportesService:
      ReportesService,
  ) {}

  @Post()
  crear(
    @Body()
    datos: CrearReporteDto,
  ) {
    return this.reportesService.crear(datos);
  }

  @Post('fotografia')
  @UseInterceptors(
    FileInterceptor('fotografia', {
      storage: diskStorage({
        destination: './uploads/reportes',

        filename: (
          _req,
          file,
          callback,
        ) => {
          const extension =
            extname(
              file.originalname,
            ).toLowerCase() || '.jpg';

          callback(
            null,
            `${randomUUID()}${extension}`,
          );
        },
      }),

      limits: {
        fileSize: 8 * 1024 * 1024,
      },

      fileFilter: filtroImagen,
    }),
  )
  subirFotografia(
    @UploadedFile()
    fotografia: Express.Multer.File,
  ) {
    if (!fotografia) {
      throw new BadRequestException(
        'Debe seleccionar una fotografía.',
      );
    }

    return {
      nombre: fotografia.filename,
      ruta:
        `uploads/reportes/${fotografia.filename}`,
      url:
        `http://localhost:3000/uploads/reportes/${fotografia.filename}`,
    };
  }

  @Get('consulta/:folio')
  consultarPorFolio(
    @Param('folio')
    folio: string,
  ) {
    return this.reportesService.buscarPorFolio(
      folio,
    );
  }

  @Get('mis-asignados')
  @UseGuards(AuthGuard)
  listarMisAsignados(
    @Req()
    request: Request & {
      user?: UsuarioToken;
    },
  ) {
    const usuario = request.user;

    if (
      !usuario ||
      usuario.rol !== 'Cuadrilla' ||
      !usuario.cuadrillaId
    ) {
      throw new ForbiddenException(
        'Esta opción está disponible únicamente para usuarios de cuadrilla.',
      );
    }

    return this.reportesService.listarPorCuadrilla(
      usuario.cuadrillaId,
    );
  }

  @Get()
  @UseGuards(AuthGuard)
  listarTodos() {
    return this.reportesService.listarTodos();
  }

  @Get(':id/evidencias')
  @UseGuards(AuthGuard)
  obtenerEvidencias(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    return this.reportesService.obtenerEvidencias(
      id,
    );
  }

  @Patch(':id/cuadrilla')
  @UseGuards(AuthGuard)
  asignarCuadrilla(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    datos: {
      cuadrillaId: number;
    },
  ) {
    if (
      !datos.cuadrillaId ||
      Number.isNaN(
        Number(datos.cuadrillaId),
      )
    ) {
      throw new BadRequestException(
        'Debe seleccionar una cuadrilla válida.',
      );
    }

    return this.reportesService.asignarCuadrilla(
      id,
      Number(datos.cuadrillaId),
    );
  }

  @Post(':id/evidencias/danio')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FilesInterceptor(
      'fotografias',
      5,
      {
        storage: diskStorage({
          destination:
            './uploads/evidencias',

          filename: (
            _req,
            file,
            callback,
          ) => {
            const extension =
              extname(
                file.originalname,
              ).toLowerCase() ||
              '.jpg';

            callback(
              null,
              `${randomUUID()}${extension}`,
            );
          },
        }),

        limits: {
          fileSize:
            8 * 1024 * 1024,
        },

        fileFilter:
          filtroImagen,
      },
    ),
  )
  async subirEvidenciaDanio(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @UploadedFiles()
    fotografias:
      Express.Multer.File[],
  ) {
    if (
      !fotografias ||
      fotografias.length === 0
    ) {
      throw new BadRequestException(
        'Debe seleccionar al menos una fotografía.',
      );
    }

    return Promise.all(
      fotografias.map(
        (fotografia) =>
          this.reportesService.registrarEvidencia(
            id,
            TipoEvidencia.DANIO,
            `uploads/evidencias/${fotografia.filename}`,
          ),
      ),
    );
  }

  @Post(':id/evidencias/reparacion')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FilesInterceptor(
      'fotografias',
      5,
      {
        storage: diskStorage({
          destination:
            './uploads/evidencias',

          filename: (
            _req,
            file,
            callback,
          ) => {
            const extension =
              extname(
                file.originalname,
              ).toLowerCase() ||
              '.jpg';

            callback(
              null,
              `${randomUUID()}${extension}`,
            );
          },
        }),

        limits: {
          fileSize:
            8 * 1024 * 1024,
        },

        fileFilter:
          filtroImagen,
      },
    ),
  )
  async subirEvidenciaReparacion(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @UploadedFiles()
    fotografias:
      Express.Multer.File[],
  ) {
    if (
      !fotografias ||
      fotografias.length === 0
    ) {
      throw new BadRequestException(
        'Debe seleccionar al menos una fotografía.',
      );
    }

    return Promise.all(
      fotografias.map(
        (fotografia) =>
          this.reportesService.registrarEvidencia(
            id,
            TipoEvidencia.REPARACION,
            `uploads/evidencias/${fotografia.filename}`,
          ),
      ),
    );
  }

  @Patch(':id/terminar')
  @UseGuards(AuthGuard)
  terminarReporte(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    return this.reportesService.terminarReporte(
      id,
    );
  }

  @Patch(':id/estado')
  @UseGuards(AuthGuard)
  actualizarEstado(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    datos: ActualizarEstadoDto,
  ) {
    return this.reportesService.actualizarEstado(
      id,
      datos,
    );
  }
}

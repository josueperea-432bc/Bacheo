import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CuadrillasService } from './cuadrillas.service';

interface UsuarioToken {
  sub: number;
  usuario: string;
  rol: string;
  cuadrillaId?: number | null;
}

@Controller('cuadrillas')
@UseGuards(AuthGuard)
export class CuadrillasController {
  constructor(
    private readonly cuadrillasService:
      CuadrillasService,
  ) {}

  private validarGestor(
    request: Request & {
      user?: UsuarioToken;
    },
  ) {
    const rol =
      request.user?.rol;

    if (
      rol !== 'Administrador' &&
      rol !== 'Revisor'
    ) {
      throw new ForbiddenException(
        'No tienes permisos para administrar cuadrillas.',
      );
    }
  }

  @Get()
  listar() {
    return this.cuadrillasService.listar();
  }

  @Post()
  crear(
    @Req()
    request: Request & {
      user?: UsuarioToken;
    },

    @Body()
    datos: {
      nombre: string;
      responsable: string;
      telefono?: string;
    },
  ) {
    this.validarGestor(request);

    return this.cuadrillasService.crear(
      datos,
    );
  }

  @Patch(':id')
  actualizar(
    @Req()
    request: Request & {
      user?: UsuarioToken;
    },

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    datos: {
      nombre: string;
      responsable: string;
      telefono?: string;
    },
  ) {
    this.validarGestor(request);

    return this.cuadrillasService.actualizar(
      id,
      datos,
    );
  }

  @Patch(':id/baja')
  darDeBaja(
    @Req()
    request: Request & {
      user?: UsuarioToken;
    },

    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    this.validarGestor(request);

    return this.cuadrillasService.darDeBaja(
      id,
    );
  }
}

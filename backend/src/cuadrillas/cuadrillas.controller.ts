import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CuadrillasService } from './cuadrillas.service';

@Controller('cuadrillas')
@UseGuards(AuthGuard)
export class CuadrillasController {
  constructor(
    private readonly cuadrillasService:
      CuadrillasService,
  ) {}

  @Get()
  listar() {
    return this.cuadrillasService.listar();
  }

  @Post()
  crear(
    @Body()
    datos: {
      nombre: string;
      responsable: string;
      telefono?: string;
    },
  ) {
    return this.cuadrillasService.crear(
      datos,
    );
  }
}

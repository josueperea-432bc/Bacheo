import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuariosService:
      UsuariosService,

    private readonly jwtService:
      JwtService,
  ) {}

  async login(datos: LoginDto) {
    const usuario =
      await this.usuariosService
        .buscarPorUsuarioConPassword(
          datos.usuario,
        );

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException(
        'Usuario o contraseña incorrectos.',
      );
    }

    const passwordCorrecto =
      await bcrypt.compare(
        datos.contrasena,
        usuario.passwordHash,
      );

    if (!passwordCorrecto) {
      throw new UnauthorizedException(
        'Usuario o contraseña incorrectos.',
      );
    }

    if (
      usuario.rol === 'Cuadrilla' &&
      !usuario.cuadrillaId
    ) {
      throw new UnauthorizedException(
        'El usuario de cuadrilla no tiene una cuadrilla asignada.',
      );
    }

    const payload = {
      sub: usuario.id,
      usuario: usuario.usuario,
      rol: usuario.rol,
      cuadrillaId:
        usuario.cuadrillaId,
    };

    const accessToken =
      await this.jwtService.signAsync(
        payload,
      );

    return {
      accessToken,

      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        usuario: usuario.usuario,
        rol: usuario.rol,
        cuadrillaId:
          usuario.cuadrillaId,
      },
    };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuariosRepository: Repository<Usuario>,
  ) {}

  buscarPorUsuarioConPassword(usuario: string): Promise<Usuario | null> {
    return this.usuariosRepository
      .createQueryBuilder('usuario')
      .addSelect('usuario.passwordHash')
      .where('usuario.usuario = :usuario', { usuario })
      .getOne();
  }

  buscarPorId(id: number): Promise<Usuario | null> {
    return this.usuariosRepository.findOne({
      where: { id },
    });
  }
}

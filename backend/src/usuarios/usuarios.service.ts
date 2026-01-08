import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Hermandad } from '@backend/hermandades/entities/hermandad.entity';
import { RolUsuario, Usuario } from './entities/usuario.entity';
import { Repository } from 'typeorm';
import { Banda } from '@backend/bandas/entities/banda.entity';
@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario)
        private readonly usuariosRepo: Repository<Usuario>,
        @InjectRepository(Hermandad)
        private readonly hermandadesRepo: Repository<Hermandad>,
        @InjectRepository(Banda)
        private readonly bandasRepo: Repository<Banda>,
    ) {}

    async create(createUsuarioDto: CreateUsuarioDto) {
        console.log('Creando usuario:', createUsuarioDto);
        const { password, ...datosUsuario } = createUsuarioDto;

        const existeEmail = await this.usuariosRepo.findOneBy({
            email: createUsuarioDto.email,
        });

        if (existeEmail) {
            throw new BadRequestException('El email ya está en uso');
        }

        const existeUsername = await this.usuariosRepo.findOneBy({
            username: datosUsuario.username,
        });

        if (existeUsername) {
            throw new BadRequestException('El username ya está en uso');
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const nuevoUsuario = this.usuariosRepo.create({
            ...datosUsuario,
            password: hashedPassword,
        });

        const usuarioGuardado = await this.usuariosRepo.save(nuevoUsuario);

        if (usuarioGuardado.rol === RolUsuario.HERMANDAD) {
            const nuevaHermandad = this.hermandadesRepo.create({
                nombre: `Hermandad ${usuarioGuardado.nombre}`,
                templo: createUsuarioDto.templo || 'Templo por definir',
                diaSalida: createUsuarioDto.diaSalida || 'Día por definir',
                usuarioId: usuarioGuardado.id,
                ciudadId: createUsuarioDto.ciudadId,
            });
            await this.hermandadesRepo.save(nuevaHermandad);
        }

        if (usuarioGuardado.rol === RolUsuario.BANDA) {
            const nuevaBanda = this.bandasRepo.create({
                nombre: createUsuarioDto.nombre,
                estiloMusical:
                    createUsuarioDto.estiloMusical || 'No especificado',
                localidad: createUsuarioDto.localidad || 'No especificada',
                direccion: createUsuarioDto.direccion || 'No especificada',
                usuarioId: usuarioGuardado.id,
            });
            await this.bandasRepo.save(nuevaBanda);
        }

        return usuarioGuardado;
    }

    async findAll() {
        return await this.usuariosRepo.find({
            relations: ['hermandad', 'banda'],
        });
    }

    async findOne(id: number) {
        return await this.usuariosRepo.findOneBy({ id });
    }

    update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
        return `This action updates a #${id} usuario`;
    }

    remove(id: number) {
        return `This action removes a #${id} usuario`;
    }
}

import { RolUsuario } from '../entities/usuario.entity';

export class CreateUsuarioDto {
    nombre: string;
    username: string;
    email: string;
    password: string;
    rol?: RolUsuario;
}

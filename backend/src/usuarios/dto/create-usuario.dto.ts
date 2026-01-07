import { RolUsuario } from '../entities/usuario.entity';

export class CreateUsuarioDto {
    nombre: string;
    username: string;
    email: string;
    password: string;
    rol: RolUsuario;

    ciudadId?: number;
    direccion?: string;

    //Campos adicionales para bandas
    estiloMusical?: string;
    localidad?: string;

    //Campos adicionales para hermandades
    templo?: string;
    diaSalida?: string;
}

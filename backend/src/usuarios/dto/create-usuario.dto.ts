import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '../entities/usuario.entity';

export class CreateUsuarioDto {
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @IsString()
    @IsNotEmpty()
    username: string;

    @IsEmail({}, { message: 'El email no tiene un formato válido' })
    email: string;

    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;

    @IsEnum(RolUsuario, { message: 'El rol no es válido' })
    rol: RolUsuario;

    @IsNumber()
    @IsOptional()
    ciudadId?: number;

    @IsString()
    @IsOptional()
    direccion?: string;

    // --- Campos adicionales para bandas ---
    @IsString()
    @IsOptional()
    estiloMusical?: string;

    @IsString()
    @IsOptional()
    localidad?: string;

    // --- Campos adicionales para hermandades ---
    @IsString()
    @IsOptional()
    templo?: string;

    @IsString()
    @IsOptional()
    diaSalida?: string;
}

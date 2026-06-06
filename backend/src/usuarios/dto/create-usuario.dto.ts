import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario } from '../entities/usuario.entity';

export class CreateUsuarioDto {
    @ApiProperty({ description: 'Nombre completo del usuario', example: 'Juan García' })
    @IsString()
    @IsNotEmpty()
    nombre: string;

    @ApiProperty({ description: 'Nombre de usuario único', example: 'juangarcia' })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ description: 'Correo electrónico del usuario', example: 'juan@example.com' })
    @IsEmail({}, { message: 'El email no tiene un formato válido' })
    email: string;

    @ApiProperty({ description: 'Contraseña (mínimo 6 caracteres)', example: 'contraseña123' })
    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;

    @ApiProperty({ description: 'Rol del usuario en la plataforma', enum: RolUsuario, example: RolUsuario.COFRADE })
    @IsEnum(RolUsuario, { message: 'El rol no es válido' })
    rol: RolUsuario;

    @ApiPropertyOptional({ description: 'Ciudad de residencia del usuario', example: 'Sevilla' })
    @IsString()
    @IsOptional()
    ciudad?: string;

    @ApiPropertyOptional({ description: 'Dirección del usuario', example: 'Calle Real, 5' })
    @IsString()
    @IsOptional()
    direccion?: string;

    // --- Campos adicionales para bandas ---
    @ApiPropertyOptional({ description: 'Estilo musical (solo para bandas)', example: 'Marchas Procesionales' })
    @IsString()
    @IsOptional()
    estiloMusical?: string;

    @ApiPropertyOptional({ description: 'Localidad de la banda', example: 'Sevilla' })
    @IsString()
    @IsOptional()
    localidad?: string;

    // --- Campos adicionales para hermandades ---
    @ApiPropertyOptional({ description: 'Nombre del templo de la hermandad', example: 'Iglesia de San Gil' })
    @IsString()
    @IsOptional()
    templo?: string;

    @ApiPropertyOptional({ description: 'Día de salida procesional', example: 'Jueves Santo' })
    @IsString()
    @IsOptional()
    diaSalida?: string;
}

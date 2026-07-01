import { IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePerfilDto {
    @ApiPropertyOptional({ description: 'Nombre visible del usuario' })
    @IsString()
    @IsOptional()
    nombre?: string;

    @ApiPropertyOptional({ description: 'Nombre de usuario único (letras, números y _)' })
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'El username solo puede contener letras, números y guiones bajos',
    })
    @IsOptional()
    username?: string;

    @ApiPropertyOptional({ description: 'Contraseña actual (requerida para cambiar la contraseña)' })
    @IsString()
    @IsOptional()
    passwordActual?: string;

    @ApiPropertyOptional({ description: 'Nueva contraseña (mínimo 6 caracteres)' })
    @IsString()
    @MinLength(6)
    @IsOptional()
    passwordNueva?: string;
}

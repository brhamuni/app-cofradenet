import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePerfilDto {
    @ApiPropertyOptional({ description: 'Nombre visible del usuario' })
    @IsString()
    @IsOptional()
    nombre?: string;

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

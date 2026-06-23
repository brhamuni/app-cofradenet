import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class LoginUsuarioDto {
    @ApiPropertyOptional({
        description: 'Nombre de usuario',
        example: 'juangarcia',
    })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty({
        description: 'Contraseña del usuario',
        example: 'contraseña123',
    })
    @IsString()
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    password: string;
}

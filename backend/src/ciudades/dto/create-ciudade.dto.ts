import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCiudadeDto {
    @ApiProperty({ description: 'Nombre de la ciudad', example: 'Sevilla' })
    @IsString({ message: 'El nombre debe ser un texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    nombre: string;

    @ApiPropertyOptional({
        description: 'Provincia a la que pertenece la ciudad',
        example: 'Sevilla',
    })
    @IsString()
    @IsOptional()
    provincia?: string;

    @ApiPropertyOptional({
        description: 'País de la ciudad',
        example: 'España',
    })
    @IsString()
    @IsOptional()
    pais?: string;
}

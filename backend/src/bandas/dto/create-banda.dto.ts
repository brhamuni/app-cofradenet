import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsArray,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBandaDto {
    @ApiProperty({
        description: 'Nombre oficial de la banda',
        example: 'Banda de Cornetas y Tambores Ntro. Padre Jesús',
    })
    @IsString({ message: 'El nombre debe ser un texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    nombre: string;

    @ApiProperty({
        description: 'Estilo musical de la banda',
        example: 'Marchas Procesionales',
    })
    @IsString({ message: 'El estilo musical debe ser un texto' })
    @IsNotEmpty({ message: 'El estilo musical es obligatorio' })
    estiloMusical: string;

    @ApiPropertyOptional({
        description: 'Localidad donde tiene sede la banda',
        example: 'Sevilla',
    })
    @IsString()
    @IsOptional()
    localidad?: string;

    @ApiPropertyOptional({
        description: 'Número de componentes de la banda',
        example: 120,
    })
    @IsNumber()
    @IsOptional()
    numeroComponentes?: number;

    @ApiPropertyOptional({
        description: 'URL del logotipo de la banda',
        example: 'https://example.com/logo.png',
    })
    @IsString()
    @IsOptional()
    imagenLogo?: string;

    @ApiPropertyOptional({
        description: 'ID del usuario propietario de la cuenta de banda',
        example: 3,
    })
    @IsNumber()
    @IsOptional()
    usuarioId?: number;

    @ApiPropertyOptional({
        description: 'ID de la ciudad donde tiene sede la banda',
        example: 1,
    })
    @IsNumber()
    @IsOptional()
    ciudadId?: number;

    @ApiPropertyOptional({
        description: 'Historia de la banda',
        example: 'Fundada en 1985...',
    })
    @IsString()
    @IsOptional()
    historia?: string;

    @ApiPropertyOptional({
        description: 'IDs de marchas del repertorio de la banda',
        example: [1, 2, 3],
    })
    @IsArray()
    @IsOptional()
    repertorioIds?: number[];
}

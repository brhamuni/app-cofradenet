import { IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoPublicacion } from '../entities/publicacion.entity';

export class CreatePublicacionDto {
    @ApiProperty({ description: 'Contenido de la publicación', example: 'La procesión del Gran Poder fue espectacular este año.' })
    @IsString()
    @MinLength(1)
    contenido: string;

    @ApiPropertyOptional({ description: 'URL de la imagen adjunta', example: 'https://example.com/imagen.jpg' })
    @IsString()
    @IsOptional()
    imagenUrl?: string;

    @ApiPropertyOptional({ description: 'URL externa de red social (YouTube, Instagram, X)', example: 'https://www.youtube.com/watch?v=abc123' })
    @IsString()
    @IsOptional()
    urlExterna?: string;

    @ApiPropertyOptional({ description: 'Tipo de publicación', enum: TipoPublicacion, example: TipoPublicacion.GENERAL })
    @IsEnum(TipoPublicacion)
    @IsOptional()
    tipo?: TipoPublicacion;

    @ApiPropertyOptional({ description: 'ID de la hermandad autora (si aplica)', example: 1 })
    @IsNumber()
    @IsOptional()
    hermandadId?: number;

    @ApiPropertyOptional({ description: 'ID de la banda autora (si aplica)', example: 2 })
    @IsNumber()
    @IsOptional()
    bandaId?: number;
}

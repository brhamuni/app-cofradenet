import { IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { TipoPublicacion } from '../entities/publicacion.entity';

export class CreatePublicacionDto {
    @IsString()
    @MinLength(1)
    contenido: string;

    @IsString()
    @IsOptional()
    imagenUrl?: string;

    @IsEnum(TipoPublicacion)
    @IsOptional()
    tipo?: TipoPublicacion;

    @IsNumber()
    @IsOptional()
    hermandadId?: number;

    @IsNumber()
    @IsOptional()
    bandaId?: number;
}

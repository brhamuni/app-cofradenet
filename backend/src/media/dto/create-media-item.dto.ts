import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMediaItemDto {
    @IsString()
    @IsOptional()
    titulo?: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    anio?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    ciudadId?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    hermandadId?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    bandaId?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    procesionId?: number;

    @IsString()
    @IsOptional()
    url?: string;
}

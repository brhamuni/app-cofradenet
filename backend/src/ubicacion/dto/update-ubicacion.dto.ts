import { IsBoolean, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUbicacionDto {
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    latitud?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    longitud?: number;

    @IsBoolean()
    estaActiva: boolean;
}

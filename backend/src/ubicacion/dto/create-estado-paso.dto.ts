import { IsEnum, IsInt, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoEstadoPaso {
    LEVANTA = 'LEVANTA',
    PARA = 'PARA',
    MARCHA = 'MARCHA',
    OTRO = 'OTRO',
}

export class CreateEstadoPasoDto {
    @IsEnum(TipoEstadoPaso)
    estado: TipoEstadoPaso;

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    pasoId?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    latitud?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    longitud?: number;
}

import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEstadoPasoDto {
    @IsString()
    @IsNotEmpty()
    nombrePaso: string;

    @IsString()
    @IsNotEmpty()
    estado: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    latitud?: number;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    longitud?: number;
}

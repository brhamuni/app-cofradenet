import {
    IsString,
    IsDateString,
    IsNumber,
    IsArray,
    ValidateNested,
    IsOptional,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

class PuntoItinerarioDto {
    @IsNumber()
    orden: number;

    @IsString()
    nombreLugar: string;

    @IsNumber()
    latitud: number;

    @IsNumber()
    longitud: number;
}

export class CreateProcesionDto {
    @IsString()
    nombre: string;

    @IsString()
    diaSemana: string;

    @IsDateString()
    fecha: string;

    @IsString()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, {
        message: 'La hora debe tener formato HH:mm:ss',
    })
    horaSalida: string;

    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, {
        message: 'La hora debe tener formato HH:mm:ss',
    })
    horaEntrada?: string;

    @IsNumber()
    hermandadId: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PuntoItinerarioDto)
    itinerario?: PuntoItinerarioDto[];
}

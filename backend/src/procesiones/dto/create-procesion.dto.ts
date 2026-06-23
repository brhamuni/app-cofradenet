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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PuntoItinerarioDto {
    @ApiProperty({ description: 'Orden del punto en el recorrido', example: 1 })
    @IsNumber()
    orden: number;

    @ApiProperty({
        description: 'Nombre del lugar',
        example: 'Iglesia de San Gil',
    })
    @IsString()
    nombreLugar: string;

    @ApiProperty({ description: 'Latitud geográfica', example: 37.3891 })
    @IsNumber()
    latitud: number;

    @ApiProperty({ description: 'Longitud geográfica', example: -5.9845 })
    @IsNumber()
    longitud: number;
}

export class CreateProcesionDto {
    @ApiProperty({
        description: 'Nombre de la procesión',
        example: 'Procesión del Gran Poder',
    })
    @IsString()
    nombre: string;

    @ApiProperty({
        description: 'Día de la semana de la procesión',
        example: 'Viernes Santo',
    })
    @IsString()
    diaSemana: string;

    @ApiProperty({
        description: 'Fecha de la procesión en formato ISO 8601',
        example: '2025-04-18',
    })
    @IsDateString()
    fecha: string;

    @ApiProperty({
        description: 'Hora de salida en formato HH:mm:ss',
        example: '21:00:00',
    })
    @IsString()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, {
        message: 'La hora debe tener formato HH:mm:ss',
    })
    horaSalida: string;

    @ApiPropertyOptional({
        description: 'Hora de entrada en formato HH:mm:ss',
        example: '02:30:00',
    })
    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, {
        message: 'La hora debe tener formato HH:mm:ss',
    })
    horaEntrada?: string;

    @ApiProperty({ description: 'ID de la hermandad organizadora', example: 1 })
    @IsNumber()
    hermandadId: number;

    @ApiPropertyOptional({
        description: 'Puntos del itinerario procesional',
        type: [PuntoItinerarioDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PuntoItinerarioDto)
    itinerario?: PuntoItinerarioDto[];
}

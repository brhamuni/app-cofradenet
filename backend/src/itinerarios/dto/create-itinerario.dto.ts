import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateItinerarioDto {
    @ApiProperty({ description: 'Año del itinerario', example: 2025 })
    @IsInt()
    @IsNotEmpty()
    anio: number;

    @ApiPropertyOptional({
        description: 'Horario de salida en formato HH:mm:ss',
        example: '21:00:00',
    })
    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, {
        message: 'La hora debe tener formato HH:mm:ss',
    })
    horarioSalida?: string;

    @ApiPropertyOptional({
        description: 'Horario de entrada en formato HH:mm:ss',
        example: '02:30:00',
    })
    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, {
        message: 'La hora debe tener formato HH:mm:ss',
    })
    horarioEntrada?: string;

    @ApiPropertyOptional({
        description: 'Descripción del recorrido procesional',
        example: 'Salida por Calle Sierpes, regreso por Calle Tetuán',
    })
    @IsString()
    @IsOptional()
    recorrido?: string;

    @ApiProperty({
        description: 'ID de la procesión a la que pertenece el itinerario',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    procesionId: number;
}

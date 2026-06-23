import {
    IsString,
    IsNotEmpty,
    IsDateString,
    MinLength,
    IsOptional,
    IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventoDto {
    @ApiProperty({
        description: 'Título del evento',
        example: 'Concierto de Marchas Procesionales',
    })
    @IsString({ message: 'El título debe ser un texto' })
    @IsNotEmpty({ message: 'El título no puede estar vacío' })
    @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
    titulo: string;

    @ApiProperty({
        description: 'Fecha y hora del evento en formato ISO 8601',
        example: '2025-03-15T20:00:00.000Z',
    })
    @IsDateString({}, { message: 'La fecha debe tener formato ISO 8601' })
    @IsNotEmpty()
    fechaHora: string;

    @ApiProperty({
        description: 'Lugar donde se celebra el evento',
        example: 'Teatro de la Maestranza',
    })
    @IsString()
    @IsNotEmpty({ message: 'El lugar es obligatorio' })
    lugar: string;

    @ApiPropertyOptional({
        description: 'Descripción detallada del evento',
        example: 'Concierto benéfico a favor de la hermandad.',
    })
    @IsString()
    @IsOptional()
    descripcion?: string;

    @ApiPropertyOptional({
        description: 'Tipo de evento',
        example: 'Concierto',
    })
    @IsString()
    @IsOptional()
    tipo?: string;

    @ApiProperty({ description: 'ID de la banda organizadora', example: 2 })
    @IsInt({ message: 'El ID de la banda debe ser un número entero' })
    @IsNotEmpty({ message: 'La banda es obligatoria' })
    bandaId: number;
}

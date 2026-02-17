import {
    IsString,
    IsNotEmpty,
    IsDateString,
    IsOptional,
    MinLength,
} from 'class-validator';

export class CreateEventoDto {
    @IsString({ message: 'El título debe ser un texto' })
    @IsNotEmpty({ message: 'El título no puede estar vacío' })
    @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
    titulo: string;

    @IsDateString(
        {},
        {
            message:
                'La fecha debe tener formato ISO 8601 (Ej: 2026-03-15T19:30:00)',
        },
    )
    @IsNotEmpty()
    fechaHora: string;

    @IsString()
    @IsNotEmpty({ message: 'El lugar es obligatorio' })
    lugar: string;

    @IsString()
    descripcion?: string;

    @IsString()
    tipo?: string; // Por defecto será 'concierto' si no se envía
}

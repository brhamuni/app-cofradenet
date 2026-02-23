import {
    IsString,
    IsNotEmpty,
    IsDateString,
    MinLength,
    IsOptional,
    IsInt,
} from 'class-validator';

export class CreateEventoDto {
    @IsString({ message: 'El título debe ser un texto' })
    @IsNotEmpty({ message: 'El título no puede estar vacío' })
    @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
    titulo: string;

    @IsDateString({}, { message: 'La fecha debe tener formato ISO 8601' })
    @IsNotEmpty()
    fechaHora: string;

    @IsString()
    @IsNotEmpty({ message: 'El lugar es obligatorio' })
    lugar: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsString()
    @IsOptional()
    tipo?: string;

    @IsInt({ message: 'El ID de la banda debe ser un número entero' })
    @IsNotEmpty({ message: 'La banda es obligatoria' })
    bandaId: number;
}

import { IsString, IsNotEmpty, IsNumber, IsOptional, MinLength } from 'class-validator';

export class CreateHermandadDto {
    @IsString({ message: 'El nombre debe ser un texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    nombre: string;

    @IsNumber()
    @IsOptional()
    añoFundacion?: number;

    @IsString({ message: 'El templo debe ser un texto' })
    @IsNotEmpty({ message: 'El templo es obligatorio' })
    templo: string;

    @IsString()
    @IsOptional()
    direccion?: string;

    @IsString()
    @IsOptional()
    codigoPostal?: string;

    @IsString()
    @IsOptional()
    diaSalida?: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsString()
    @IsOptional()
    imagenEscudo?: string;

    @IsNumber()
    @IsNotEmpty({ message: 'La ciudadId es obligatoria' })
    ciudadId: number;

    @IsNumber()
    @IsOptional()
    usuarioId?: number;

    @IsString()
    @IsOptional()
    historia?: string;

    @IsString()
    @IsOptional()
    patrimonio?: string;
}

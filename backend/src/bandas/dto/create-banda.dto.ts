import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsArray,
    MinLength,
} from 'class-validator';

export class CreateBandaDto {
    @IsString({ message: 'El nombre debe ser un texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    nombre: string;

    @IsString({ message: 'El estilo musical debe ser un texto' })
    @IsNotEmpty({ message: 'El estilo musical es obligatorio' })
    estiloMusical: string;

    @IsString()
    @IsOptional()
    localidad?: string;

    @IsNumber()
    @IsOptional()
    numeroComponentes?: number;

    @IsString()
    @IsOptional()
    imagenLogo?: string;

    @IsNumber()
    @IsOptional()
    usuarioId?: number;

    @IsNumber()
    @IsOptional()
    ciudadId?: number;

    @IsString()
    @IsOptional()
    historia?: string;

    @IsArray()
    @IsOptional()
    repertorioIds?: number[];
}

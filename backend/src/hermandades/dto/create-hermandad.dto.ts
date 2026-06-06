import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHermandadDto {
    @ApiProperty({ description: 'Nombre oficial de la hermandad', example: 'Hermandad del Gran Poder' })
    @IsString({ message: 'El nombre debe ser un texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    nombre: string;

    @ApiPropertyOptional({ description: 'Año de fundación de la hermandad', example: 1431 })
    @IsNumber()
    @IsOptional()
    añoFundacion?: number;

    @ApiProperty({ description: 'Nombre del templo donde tiene sede la hermandad', example: 'Basílica del Gran Poder' })
    @IsString({ message: 'El templo debe ser un texto' })
    @IsNotEmpty({ message: 'El templo es obligatorio' })
    templo: string;

    @ApiPropertyOptional({ description: 'Dirección del templo', example: 'Plaza de San Lorenzo, s/n' })
    @IsString()
    @IsOptional()
    direccion?: string;

    @ApiPropertyOptional({ description: 'Código postal del templo', example: '41002' })
    @IsString()
    @IsOptional()
    codigoPostal?: string;

    @ApiPropertyOptional({ description: 'Día de la semana en que sale en procesión', example: 'Viernes Santo' })
    @IsString()
    @IsOptional()
    diaSalida?: string;

    @ApiPropertyOptional({ description: 'Descripción breve de la hermandad', example: 'Hermandad de penitencia con sede en San Lorenzo' })
    @IsString()
    @IsOptional()
    descripcion?: string;

    @ApiPropertyOptional({ description: 'URL de la imagen del escudo', example: 'https://example.com/escudo.png' })
    @IsString()
    @IsOptional()
    imagenEscudo?: string;

    @ApiProperty({ description: 'ID de la ciudad a la que pertenece la hermandad', example: 1 })
    @IsNumber()
    @IsNotEmpty({ message: 'La ciudadId es obligatoria' })
    ciudadId: number;

    @ApiPropertyOptional({ description: 'ID del usuario propietario de la cuenta de hermandad', example: 5 })
    @IsNumber()
    @IsOptional()
    usuarioId?: number;

    @ApiPropertyOptional({ description: 'Historia de la hermandad', example: 'Fundada en el siglo XV...' })
    @IsString()
    @IsOptional()
    historia?: string;

    @ApiPropertyOptional({ description: 'Descripción del patrimonio artístico', example: 'Paso de Cristo del siglo XVII...' })
    @IsString()
    @IsOptional()
    patrimonio?: string;
}

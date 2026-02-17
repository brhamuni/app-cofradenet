import { IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class CreateCiudadeDto {
    @IsString({ message: 'El nombre debe ser un texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
    nombre: string;

    @IsString()
    @IsOptional()
    provincia?: string;

    @IsString()
    @IsOptional()
    pais?: string;
}

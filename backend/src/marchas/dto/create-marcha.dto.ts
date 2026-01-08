import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateMarchaDto {
    @IsString()
    @IsNotEmpty({ message: 'El título de la marcha es obligatorio' })
    titulo: string;

    @IsString()
    @IsNotEmpty({ message: 'El compositor es obligatorio' })
    compositor: string;

    @IsString()
    @IsOptional()
    idExterno: string; // Aquí llegará el ID de iTunes (trackId)

    @IsString()
    @IsOptional()
    @IsUrl({}, { message: 'La imagen debe ser una URL válida' })
    imagenUrl?: string;

    // Este campo es CLAVE para saber qué quiere hacer el usuario
    @IsString()
    @IsNotEmpty()
    tipoGuardado?: 'repertorio' | 'favorita';
}

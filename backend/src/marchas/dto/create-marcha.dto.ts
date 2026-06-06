import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMarchaDto {
    @ApiProperty({ description: 'Título de la marcha procesional', example: 'La Madrugá' })
    @IsString()
    @IsNotEmpty({ message: 'El título de la marcha es obligatorio' })
    titulo: string;

    @ApiProperty({ description: 'Nombre del compositor de la marcha', example: 'Abel Moreno' })
    @IsString()
    @IsNotEmpty({ message: 'El compositor es obligatorio' })
    compositor: string;

    @ApiPropertyOptional({ description: 'Identificador externo de la marcha (trackId de iTunes)', example: '123456789' })
    @IsString()
    @IsOptional()
    idExterno: string;

    @ApiPropertyOptional({ description: 'URL de la imagen de portada', example: 'https://example.com/marcha.jpg' })
    @IsString()
    @IsOptional()
    @IsUrl({}, { message: 'La imagen debe ser una URL válida' })
    imagenUrl?: string;

    @ApiPropertyOptional({ description: 'Tipo de guardado: repertorio de banda o favorita de cofrade', enum: ['repertorio', 'favorita'], example: 'repertorio' })
    @IsString()
    @IsNotEmpty()
    tipoGuardado?: 'repertorio' | 'favorita';
}

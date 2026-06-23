import { PartialType } from '@nestjs/mapped-types';
import { CreateBandaDto } from './create-banda.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBandaDto extends PartialType(CreateBandaDto) {
    @ApiPropertyOptional({
        description: 'Nombre de la banda',
        example: 'Banda de Música Santa Cecilia',
    })
    nombre?: string;

    @ApiPropertyOptional({
        description: 'Estilo musical',
        example: 'Banda de Música',
    })
    estiloMusical?: string;

    @ApiPropertyOptional({
        description: 'Historia de la banda',
        example: 'Fundada en 1990...',
    })
    historia?: string;

    @ApiPropertyOptional({
        description: 'IDs de marchas del repertorio',
        example: [1, 4, 7],
    })
    repertorioIds?: number[];

    @ApiPropertyOptional({ description: 'ID de la ciudad', example: 2 })
    ciudadId?: number;

    @ApiPropertyOptional({ description: 'Número de componentes', example: 85 })
    numeroComponentes?: number;
}

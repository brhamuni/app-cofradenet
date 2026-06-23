import { PartialType } from '@nestjs/mapped-types';
import { CreateHermandadDto } from './create-hermandad.dto';
import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateHermandadDto extends PartialType(CreateHermandadDto) {
    @ApiPropertyOptional({
        description: 'Nombre popular o apodo de la hermandad',
        example: 'El Gran Poder',
    })
    @IsString()
    @IsOptional()
    nombrePopular?: string;

    @ApiPropertyOptional({
        description: 'Lista de titulares de la hermandad',
        example: ['Señor del Gran Poder', 'Ntra. Sra. del Mayor Dolor'],
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    titulares?: string[];
}

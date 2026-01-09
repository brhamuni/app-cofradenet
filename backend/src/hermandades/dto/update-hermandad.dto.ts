import { PartialType } from '@nestjs/mapped-types';
import { CreateHermandadDto } from './create-hermandad.dto';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateHermandadDto extends PartialType(CreateHermandadDto) {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsString()
    @IsOptional()
    templo?: string;

    @IsUrl()
    @IsOptional()
    escudoUrl?: string;

    @IsString()
    @IsOptional()
    historia?: string;

    @IsString()
    @IsOptional()
    patrimonio?: string;
}

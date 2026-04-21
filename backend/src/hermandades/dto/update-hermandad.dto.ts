import { PartialType } from '@nestjs/mapped-types';
import { CreateHermandadDto } from './create-hermandad.dto';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateHermandadDto extends PartialType(CreateHermandadDto) {
    @IsString()
    @IsOptional()
    nombrePopular?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    titulares?: string[];
}

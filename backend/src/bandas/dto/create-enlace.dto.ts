import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { PlataformaEnlace } from '../entities/enlace-externo.entity';

export class CreateEnlaceDto {
    @IsUrl()
    url: string;

    @IsEnum(PlataformaEnlace)
    @IsOptional()
    plataforma?: PlataformaEnlace;

    @IsString()
    @IsOptional()
    titulo?: string;
}

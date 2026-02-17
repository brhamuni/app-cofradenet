import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateParticipacionDto {
    @IsInt()
    @IsNotEmpty()
    anio: number;

    @IsString()
    @IsOptional()
    posicion?: string; // Ej: "Tras el paso de Cristo"

    @IsInt()
    @IsNotEmpty()
    procesionId: number;

    @IsInt()
    @IsNotEmpty()
    bandaId: number;
}

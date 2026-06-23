import { IsInt, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateParticipacionDto {
    @ApiProperty({ description: 'Año de la participación', example: 2025 })
    @IsInt()
    @IsNotEmpty()
    anio: number;

    @ApiPropertyOptional({
        description: 'Posición de la banda en el cortejo procesional',
        example: 'Tras el paso de Cristo',
    })
    @IsString()
    @IsOptional()
    posicion?: string;

    @ApiProperty({
        description: 'ID de la procesión en la que participa la banda',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    procesionId: number;

    @ApiProperty({ description: 'ID de la banda que participa', example: 3 })
    @IsInt()
    @IsNotEmpty()
    bandaId: number;
}

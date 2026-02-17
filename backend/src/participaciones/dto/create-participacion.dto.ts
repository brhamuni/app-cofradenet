import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreateParticipacionDto {
    @IsNumber()
    @IsNotEmpty({ message: 'El año es obligatorio' })
    anio: number;

    @IsString({ message: 'La ubicación debe ser un texto' })
    @IsNotEmpty({ message: 'La ubicación es obligatoria' })
    ubicacion: string;

    @IsString()
    @IsNotEmpty({ message: 'El bandaId es obligatorio' })
    bandaId: string;

    @IsString()
    @IsNotEmpty({ message: 'El procesionId es obligatorio' })
    procesionId: string;
}

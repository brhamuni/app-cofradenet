import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
} from 'class-validator';

export class CreateItinerarioDto {
    @IsInt()
    @IsNotEmpty()
    anio: number;

    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, {
        message: 'La hora debe tener formato HH:mm:ss',
    })
    horarioSalida?: string;

    @IsString()
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):?([0-5]\d):?([0-5]\d)$/, {
        message: 'La hora debe tener formato HH:mm:ss',
    })
    horarioEntrada?: string;

    @IsString()
    @IsOptional()
    recorrido?: string;

    @IsNumber()
    @IsNotEmpty()
    procesionId: number;
}

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginUsuarioDto {
    @IsString()
    @IsOptional()
    username?: string;

    @IsString()
    @IsNotEmpty({ message: 'La contraseña es obligatoria' })
    password: string;
}

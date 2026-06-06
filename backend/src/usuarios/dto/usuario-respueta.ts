import { ApiProperty } from '@nestjs/swagger';

export class UsuarioRespuestaDto {
    @ApiProperty({ description: 'Identificador único del usuario', example: 1 })
    id: number;

    @ApiProperty({ description: 'Nombre completo del usuario', example: 'Juan García' })
    nombre: string;

    @ApiProperty({ description: 'Nombre de usuario', example: 'juangarcia' })
    username: string;

    @ApiProperty({ description: 'Correo electrónico', example: 'juan@example.com' })
    email: string;

    @ApiProperty({ description: 'Rol del usuario en la plataforma', example: 'cofrade' })
    rol: string;

    @ApiProperty({ description: 'Indica si el usuario está verificado', example: false })
    verificado: boolean;
}

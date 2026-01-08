import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUsuarioDto } from '@backend/usuarios/dto/login-usuario';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() loginDTO: LoginUsuarioDto) {
        return this.authService.login(loginDTO);
    }
}

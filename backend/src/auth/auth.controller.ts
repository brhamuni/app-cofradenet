import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginUsuarioDto } from '@backend/usuarios/dto/login-usuario';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiOperation({ summary: 'Iniciar sesión con usuario y contraseña' })
    @ApiResponse({ status: 200, description: 'Login exitoso, devuelve access_token y refresh_token' })
    @ApiResponse({ status: 401, description: 'Credenciales incorrectas' })
    @HttpCode(HttpStatus.OK)
    @Post('login')
    login(@Body() loginDTO: LoginUsuarioDto) {
        return this.authService.login(loginDTO);
    }

    @ApiOperation({ summary: 'Renovar el access token usando un refresh token' })
    @ApiResponse({ status: 200, description: 'Token renovado correctamente' })
    @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    refresh(@Body('refresh_token') refreshToken: string) {
        return this.authService.refresh(refreshToken);
    }

    @ApiOperation({ summary: 'Cerrar sesión e invalidar el refresh token' })
    @ApiResponse({ status: 200, description: 'Sesión cerrada correctamente' })
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    logout(@Body('refresh_token') refreshToken: string) {
        return this.authService.logout(refreshToken);
    }
}

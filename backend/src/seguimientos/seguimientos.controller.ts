import {
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { SeguimientosService } from './seguimientos.service';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { JwtOptionalGuard } from '@backend/auth/jwt-optional.guard';

@ApiTags('seguimientos')
@Controller('seguimientos')
export class SeguimientosController {
    constructor(private readonly service: SeguimientosService) {}

    // ── Hermandad ──────────────────────────────────────────────
    @ApiOperation({
        summary: 'Consultar estado de seguimiento de una hermandad',
    })
    @ApiResponse({
        status: 200,
        description: 'Estado de seguimiento y número de seguidores',
    })
    @Get('hermandad/:id')
    @UseGuards(JwtOptionalGuard)
    async estadoHermandad(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
    ) {
        const usuarioId = req.user?.id;
        if (!usuarioId)
            return {
                sigues: false,
                seguidores: await this.service.contarSeguidores({
                    hermandadId: id,
                }),
            };
        return this.service.estadoParaUsuario(usuarioId, { hermandadId: id });
    }

    @ApiOperation({ summary: 'Seguir una hermandad' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Ahora sigues a esta hermandad' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post('hermandad/:id')
    @UseGuards(JwtAuthGuard)
    seguirHermandad(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.seguir(req.user, { hermandadId: id });
    }

    @ApiOperation({ summary: 'Dejar de seguir una hermandad' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Has dejado de seguir a esta hermandad',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Delete('hermandad/:id')
    @UseGuards(JwtAuthGuard)
    dejarHermandad(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.dejarDeSeguir(req.user, { hermandadId: id });
    }

    // ── Banda ──────────────────────────────────────────────────
    @ApiOperation({ summary: 'Consultar estado de seguimiento de una banda' })
    @ApiResponse({
        status: 200,
        description: 'Estado de seguimiento y número de seguidores',
    })
    @Get('banda/:id')
    @UseGuards(JwtOptionalGuard)
    async estadoBanda(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        const usuarioId = req.user?.id;
        if (!usuarioId)
            return {
                sigues: false,
                seguidores: await this.service.contarSeguidores({
                    bandaId: id,
                }),
            };
        return this.service.estadoParaUsuario(usuarioId, { bandaId: id });
    }

    @ApiOperation({ summary: 'Seguir una banda' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Ahora sigues a esta banda' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post('banda/:id')
    @UseGuards(JwtAuthGuard)
    seguirBanda(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.seguir(req.user, { bandaId: id });
    }

    @ApiOperation({ summary: 'Dejar de seguir una banda' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Has dejado de seguir a esta banda',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Delete('banda/:id')
    @UseGuards(JwtAuthGuard)
    dejarBanda(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.dejarDeSeguir(req.user, { bandaId: id });
    }

    // ── Usuario ────────────────────────────────────────────────
    @ApiOperation({ summary: 'Consultar estado de seguimiento de un usuario' })
    @ApiResponse({
        status: 200,
        description: 'Estado de seguimiento y número de seguidores',
    })
    @Get('usuario/:id')
    @UseGuards(JwtOptionalGuard)
    async estadoUsuario(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
    ) {
        const usuarioId = req.user?.id;
        if (!usuarioId)
            return {
                sigues: false,
                seguidores: await this.service.contarSeguidores({
                    seguidoUsuarioId: id,
                }),
            };
        return this.service.estadoParaUsuario(usuarioId, {
            seguidoUsuarioId: id,
        });
    }

    @ApiOperation({ summary: 'Seguir a un usuario' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Ahora sigues a este usuario' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post('usuario/:id')
    @UseGuards(JwtAuthGuard)
    seguirUsuario(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.seguir(req.user, { seguidoUsuarioId: id });
    }

    @ApiOperation({ summary: 'Dejar de seguir a un usuario' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Has dejado de seguir a este usuario',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Delete('usuario/:id')
    @UseGuards(JwtAuthGuard)
    dejarUsuario(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.dejarDeSeguir(req.user, { seguidoUsuarioId: id });
    }
}

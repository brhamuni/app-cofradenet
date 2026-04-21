import { Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { SeguimientosService } from './seguimientos.service';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { JwtOptionalGuard } from '@backend/auth/jwt-optional.guard';

@Controller('seguimientos')
export class SeguimientosController {
    constructor(private readonly service: SeguimientosService) {}

    // ── Hermandad ──────────────────────────────────────────────
    @Get('hermandad/:id')
    @UseGuards(JwtOptionalGuard)
    async estadoHermandad(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
    ) {
        const usuarioId = req.user?.id;
        if (!usuarioId) return { sigues: false, seguidores: await this.service.contarSeguidores({ hermandadId: id }) };
        return this.service.estadoParaUsuario(usuarioId, { hermandadId: id });
    }

    @Post('hermandad/:id')
    @UseGuards(JwtAuthGuard)
    seguirHermandad(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.seguir(req.user, { hermandadId: id });
    }

    @Delete('hermandad/:id')
    @UseGuards(JwtAuthGuard)
    dejarHermandad(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.dejarDeSeguir(req.user, { hermandadId: id });
    }

    // ── Banda ──────────────────────────────────────────────────
    @Get('banda/:id')
    @UseGuards(JwtOptionalGuard)
    async estadoBanda(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
    ) {
        const usuarioId = req.user?.id;
        if (!usuarioId) return { sigues: false, seguidores: await this.service.contarSeguidores({ bandaId: id }) };
        return this.service.estadoParaUsuario(usuarioId, { bandaId: id });
    }

    @Post('banda/:id')
    @UseGuards(JwtAuthGuard)
    seguirBanda(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.seguir(req.user, { bandaId: id });
    }

    @Delete('banda/:id')
    @UseGuards(JwtAuthGuard)
    dejarBanda(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.dejarDeSeguir(req.user, { bandaId: id });
    }

    // ── Usuario ────────────────────────────────────────────────
    @Get('usuario/:id')
    @UseGuards(JwtOptionalGuard)
    async estadoUsuario(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
    ) {
        const usuarioId = req.user?.id;
        if (!usuarioId) return { sigues: false, seguidores: await this.service.contarSeguidores({ seguidoUsuarioId: id }) };
        return this.service.estadoParaUsuario(usuarioId, { seguidoUsuarioId: id });
    }

    @Post('usuario/:id')
    @UseGuards(JwtAuthGuard)
    seguirUsuario(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.seguir(req.user, { seguidoUsuarioId: id });
    }

    @Delete('usuario/:id')
    @UseGuards(JwtAuthGuard)
    dejarUsuario(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.dejarDeSeguir(req.user, { seguidoUsuarioId: id });
    }
}

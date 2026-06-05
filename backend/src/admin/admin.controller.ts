import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    // --- Usuarios (HUAP-01) ---

    @Get('usuarios')
    listarUsuarios(
        @Query('rol') rol?: string,
        @Query('verificado') verificado?: string,
        @Query('bloqueado') bloqueado?: string,
    ) {
        return this.adminService.findAllUsers({ rol, verificado, bloqueado });
    }

    @Get('usuarios/:id')
    getUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.findUser(id);
    }

    @Put('usuarios/:id/verificar')
    verificarUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.verificarUsuario(id);
    }

    @Put('usuarios/:id/bloquear')
    bloquearUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.bloquearUsuario(id);
    }

    @Put('usuarios/:id/desbloquear')
    desbloquearUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.desbloquearUsuario(id);
    }

    @Put('usuarios/:id/rol')
    cambiarRol(
        @Param('id', ParseIntPipe) id: number,
        @Body('rol') rol: RolUsuario,
    ) {
        return this.adminService.cambiarRol(id, rol);
    }

    @Delete('usuarios/:id')
    eliminarUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.eliminarUsuario(id);
    }

    // --- Hermandades (HUAP-01 + HUAP-02) ---

    @Get('hermandades')
    listarHermandades() {
        return this.adminService.findAllHermandades();
    }

    @Put('hermandades/:id/verificar')
    verificarHermandad(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.verificarHermandad(id);
    }

    @Put('hermandades/:id')
    editarHermandad(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
        return this.adminService.editarHermandad(id, dto);
    }

    @Delete('hermandades/:id')
    eliminarHermandad(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.eliminarHermandad(id);
    }

    // --- Bandas (HUAP-01) ---

    @Get('bandas')
    listarBandas() {
        return this.adminService.findAllBandas();
    }

    @Put('bandas/:id/verificar')
    verificarBanda(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.verificarBanda(id);
    }

    // --- Publicaciones (HUAP-01) ---

    @Delete('publicaciones/:id')
    eliminarPublicacion(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.eliminarPublicacion(id);
    }

    // --- Estadísticas (HUAP-01) ---

    @Get('estadisticas')
    getEstadisticas() {
        return this.adminService.getEstadisticas();
    }

    // --- Ciudades con contadores (HUAP-02) ---

    @Get('ciudades')
    getCiudades() {
        return this.adminService.getCiudadesConContadores();
    }
}

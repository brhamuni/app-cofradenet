import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Put,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    // --- Usuarios (HUAP-01) ---

    @ApiOperation({ summary: 'Listar todos los usuarios con filtros opcionales' })
    @ApiResponse({ status: 200, description: 'Lista de usuarios' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
    @Get('usuarios')
    listarUsuarios(
        @Query('rol') rol?: string,
        @Query('verificado') verificado?: string,
        @Query('bloqueado') bloqueado?: string,
    ) {
        return this.adminService.findAllUsers({ rol, verificado, bloqueado });
    }

    @ApiOperation({ summary: 'Obtener detalles de un usuario por ID' })
    @ApiResponse({ status: 200, description: 'Datos completos del usuario' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @Get('usuarios/:id')
    getUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.findUser(id);
    }

    @ApiOperation({ summary: 'Verificar un usuario' })
    @ApiResponse({ status: 200, description: 'Usuario verificado correctamente' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @Put('usuarios/:id/verificar')
    verificarUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.verificarUsuario(id);
    }

    @ApiOperation({ summary: 'Bloquear un usuario' })
    @ApiResponse({ status: 200, description: 'Usuario bloqueado correctamente' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @Put('usuarios/:id/bloquear')
    bloquearUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.bloquearUsuario(id);
    }

    @ApiOperation({ summary: 'Desbloquear un usuario' })
    @ApiResponse({ status: 200, description: 'Usuario desbloqueado correctamente' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @Put('usuarios/:id/desbloquear')
    desbloquearUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.desbloquearUsuario(id);
    }

    @ApiOperation({ summary: 'Cambiar el rol de un usuario' })
    @ApiResponse({ status: 200, description: 'Rol actualizado correctamente' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @Put('usuarios/:id/rol')
    cambiarRol(
        @Param('id', ParseIntPipe) id: number,
        @Body('rol') rol: RolUsuario,
    ) {
        return this.adminService.cambiarRol(id, rol);
    }

    @ApiOperation({ summary: 'Editar datos de un usuario' })
    @ApiResponse({ status: 200, description: 'Usuario editado correctamente' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @Patch('usuarios/:id')
    editarUsuario(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: { nombre?: string; username?: string; email?: string; rol?: RolUsuario; password?: string },
    ) {
        return this.adminService.editarUsuario(id, dto);
    }

    @ApiOperation({ summary: 'Eliminar un usuario permanentemente' })
    @ApiResponse({ status: 200, description: 'Usuario eliminado correctamente' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @Delete('usuarios/:id')
    eliminarUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.eliminarUsuario(id);
    }

    // --- Hermandades (HUAP-01 + HUAP-02) ---

    @ApiOperation({ summary: 'Listar todas las hermandades' })
    @ApiResponse({ status: 200, description: 'Lista de hermandades' })
    @Get('hermandades')
    listarHermandades() {
        return this.adminService.findAllHermandades();
    }

    @ApiOperation({ summary: 'Verificar una hermandad' })
    @ApiResponse({ status: 200, description: 'Hermandad verificada correctamente' })
    @ApiResponse({ status: 404, description: 'Hermandad no encontrada' })
    @Put('hermandades/:id/verificar')
    verificarHermandad(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.verificarHermandad(id);
    }

    @ApiOperation({ summary: 'Editar datos de una hermandad' })
    @ApiResponse({ status: 200, description: 'Hermandad editada correctamente' })
    @ApiResponse({ status: 404, description: 'Hermandad no encontrada' })
    @Put('hermandades/:id')
    editarHermandad(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
        return this.adminService.editarHermandad(id, dto);
    }

    @ApiOperation({ summary: 'Eliminar una hermandad permanentemente' })
    @ApiResponse({ status: 200, description: 'Hermandad eliminada correctamente' })
    @ApiResponse({ status: 404, description: 'Hermandad no encontrada' })
    @Delete('hermandades/:id')
    eliminarHermandad(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.eliminarHermandad(id);
    }

    // --- Bandas (HUAP-01) ---

    @ApiOperation({ summary: 'Listar todas las bandas' })
    @ApiResponse({ status: 200, description: 'Lista de bandas' })
    @Get('bandas')
    listarBandas() {
        return this.adminService.findAllBandas();
    }

    @ApiOperation({ summary: 'Verificar una banda' })
    @ApiResponse({ status: 200, description: 'Banda verificada correctamente' })
    @ApiResponse({ status: 404, description: 'Banda no encontrada' })
    @Put('bandas/:id/verificar')
    verificarBanda(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.verificarBanda(id);
    }

    // --- Publicaciones (HUAP-01) ---

    @ApiOperation({ summary: 'Eliminar una publicación (moderación)' })
    @ApiResponse({ status: 200, description: 'Publicación eliminada correctamente' })
    @ApiResponse({ status: 404, description: 'Publicación no encontrada' })
    @Delete('publicaciones/:id')
    eliminarPublicacion(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.eliminarPublicacion(id);
    }

    // --- Estadísticas (HUAP-01) ---

    @ApiOperation({ summary: 'Obtener estadísticas generales de la plataforma' })
    @ApiResponse({ status: 200, description: 'Estadísticas de usuarios, hermandades, bandas y publicaciones' })
    @Get('estadisticas')
    getEstadisticas() {
        return this.adminService.getEstadisticas();
    }

    // --- Ciudades con contadores (HUAP-02) ---

    @ApiOperation({ summary: 'Listar ciudades con sus contadores de hermandades y procesiones' })
    @ApiResponse({ status: 200, description: 'Lista paginada de ciudades con contadores' })
    @Get('ciudades')
    getCiudades(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('buscar') buscar?: string,
    ) {
        return this.adminService.getCiudadesConContadores(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 25,
            buscar,
        );
    }
}

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseIntPipe,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from './entities/usuario.entity';
import { NotBlockedGuard } from '@backend/auth/guards/not-blocked.guard';

@ApiTags('usuarios')
@Controller('usuarios')
@UseGuards(NotBlockedGuard)
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @ApiOperation({ summary: 'Registrar un nuevo usuario' })
    @ApiResponse({ status: 201, description: 'Usuario creado correctamente' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    @Post()
    create(@Body() createUsuarioDto: CreateUsuarioDto) {
        return this.usuariosService.create(createUsuarioDto);
    }

    @ApiOperation({ summary: 'Listar todos los usuarios (solo administrador)' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Lista completa de usuarios' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
    @Get('lista-completa')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN)
    findAll() {
        return this.usuariosService.findAll();
    }

    @ApiOperation({ summary: 'Obtener un usuario por ID' })
    @ApiResponse({ status: 200, description: 'Datos del usuario' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.usuariosService.findOne(id);
    }

    @ApiOperation({ summary: 'Actualizar datos de un usuario' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Usuario actualizado correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(
        @Param('id') id: number,
        @Body() updateUsuarioDto: UpdateUsuarioDto,
    ) {
        return this.usuariosService.update(id, updateUsuarioDto);
    }

    @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil del usuario actual' })
    @Get('perfil')
    obtenerPerfil(@Req() req) {
        return this.usuariosService.getPerfil(req.user.id);
    }

    @ApiOperation({ summary: 'Añadir o quitar una hermandad de favoritos' })
    @ApiResponse({ status: 200, description: 'Estado de favorito actualizado' })
    @Post('favoritos/hermandad/:id')
    toggleHermandad(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.usuariosService.toggleFavoritoHermandad(req.user.id, id);
    }

    @ApiOperation({ summary: 'Añadir o quitar una banda de favoritos' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Estado de favorito actualizado' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post('favoritos/banda/:id')
    @UseGuards(JwtAuthGuard)
    toggleBanda(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.usuariosService.toggleFavoritoBanda(req.user.id, id);
    }

    @ApiOperation({ summary: 'Eliminar un usuario' })
    @ApiResponse({ status: 200, description: 'Usuario eliminado correctamente' })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.usuariosService.remove(id);
    }

    @ApiOperation({ summary: 'Cambiar el rol de un usuario (solo administrador)' })
    @ApiResponse({ status: 200, description: 'Rol actualizado correctamente' })
    @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
    @Patch(':id/rol')
    @Roles(RolUsuario.ADMIN) // Solo el jefe puede ascender/degradar usuarios
    cambiarRol(
        @Param('id', ParseIntPipe) id: number,
        @Body('nuevoRol') nuevoRol: RolUsuario,
    ) {
        return this.usuariosService.updateRol(id, nuevoRol);
    }
}

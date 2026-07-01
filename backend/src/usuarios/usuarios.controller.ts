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
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';

interface AuthRequest extends Request {
    user: { id: number; username: string; rol: string };
}
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePerfilDto } from './dto/update-perfil.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from './entities/usuario.entity';
import { NotBlockedGuard } from '@backend/auth/guards/not-blocked.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ArchivosService } from '@backend/archivos/archivos.service';

@ApiTags('usuarios')
@Controller('usuarios')
@UseGuards(NotBlockedGuard)
export class UsuariosController {
    constructor(
        private readonly usuariosService: UsuariosService,
        private readonly archivosService: ArchivosService,
    ) {}

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

    @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Perfil del usuario actual' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Get('perfil')
    @UseGuards(JwtAuthGuard)
    obtenerPerfil(@Req() req: AuthRequest) {
        return this.usuariosService.getPerfil(req.user!.id);
    }

    @ApiOperation({ summary: 'Subir o actualizar el avatar del usuario autenticado' })
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: 'Avatar actualizado' })
    @Post('perfil/avatar')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                    return cb(new BadRequestException('Solo se permiten imágenes'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
        if (!file) throw new BadRequestException('No se ha subido ningún archivo');
        const archivo = await this.archivosService.store({
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
        });
        return this.usuariosService.updateAvatar(
            req.user!.id,
            this.archivosService.publicPath(archivo.id),
        );
    }

    @ApiOperation({ summary: 'Eliminar el avatar del usuario autenticado' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Avatar eliminado' })
    @Delete('perfil/avatar')
    @UseGuards(JwtAuthGuard)
    removeAvatar(@Req() req: AuthRequest) {
        return this.usuariosService.removeAvatar(req.user!.id);
    }

    @ApiOperation({ summary: 'Actualizar nombre y/o contraseña del perfil' })
    @ApiBearerAuth('access-token')
    @Patch('perfil')
    @UseGuards(JwtAuthGuard)
    updatePerfil(@Req() req: AuthRequest, @Body() dto: UpdatePerfilDto) {
        return this.usuariosService.updatePerfil(req.user!.id, dto);
    }

    @ApiOperation({ summary: 'Subir o actualizar el banner del usuario autenticado' })
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @Post('perfil/banner')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                    return cb(new BadRequestException('Solo se permiten imágenes'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadBanner(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
        if (!file) throw new BadRequestException('No se ha subido ningún archivo');
        const archivo = await this.archivosService.store({
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
        });
        return this.usuariosService.updateBanner(
            req.user!.id,
            this.archivosService.publicPath(archivo.id),
        );
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
    @ApiResponse({
        status: 200,
        description: 'Usuario actualizado correctamente',
    })
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

    @ApiOperation({ summary: 'Añadir o quitar una hermandad de favoritos' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Estado de favorito actualizado' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post('favoritos/hermandad/:id')
    @UseGuards(JwtAuthGuard)
    toggleHermandad(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: AuthRequest,
    ) {
        return this.usuariosService.toggleFavoritoHermandad(req.user!.id, id);
    }

    @ApiOperation({ summary: 'Añadir o quitar una banda de favoritos' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Estado de favorito actualizado' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post('favoritos/banda/:id')
    @UseGuards(JwtAuthGuard)
    toggleBanda(@Param('id', ParseIntPipe) id: number, @Req() req: AuthRequest) {
        return this.usuariosService.toggleFavoritoBanda(req.user!.id, id);
    }

    @ApiOperation({ summary: 'Eliminar un usuario' })
    @ApiResponse({
        status: 200,
        description: 'Usuario eliminado correctamente',
    })
    @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.usuariosService.remove(id);
    }

    @ApiOperation({
        summary: 'Cambiar el rol de un usuario (solo administrador)',
    })
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

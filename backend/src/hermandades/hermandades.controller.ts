import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
    ParseIntPipe,
    UseInterceptors,
    BadRequestException,
    UploadedFile,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiConsumes,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { HermandadesService } from './hermandades.service';
import { CreateHermandadDto } from './dto/create-hermandad.dto';
import { UpdateHermandadDto } from './dto/update-hermandad.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { NotBlockedGuard } from '@backend/auth/guards/not-blocked.guard';
import { ArchivosService } from '@backend/archivos/archivos.service';
import { MediaService } from '@backend/media/media.service';
import { TipoMedia } from '@backend/media/entities/media-item.entity';

@ApiTags('hermandades')
@Controller('hermandades')
// ❌ HEMOS QUITADO EL GUARD GLOBAL DE AQUÍ
export class HermandadesController {
    constructor(
        private readonly hermandadesService: HermandadesService,
        private readonly archivosService: ArchivosService,
        private readonly mediaService: MediaService,
    ) {}

    // ==========================================
    // RUTAS PÚBLICAS (Cualquiera puede verlas)
    // ==========================================

    @ApiOperation({ summary: 'Listar todas las hermandades' })
    @ApiResponse({ status: 200, description: 'Lista de hermandades' })
    @Get()
    findAll() {
        return this.hermandadesService.findAll();
    }

    @ApiOperation({ summary: 'Obtener la hermandad del usuario autenticado' })
    @ApiBearerAuth('access-token')
    @Get('mi-hermandad')
    @UseGuards(JwtAuthGuard)
    findMia(@Req() req: Request) {
        return this.hermandadesService.findByUsuario((req.user as any).id);
    }

    @ApiOperation({ summary: 'Obtener una hermandad por ID' })
    @ApiResponse({ status: 200, description: 'Datos de la hermandad' })
    @ApiResponse({ status: 404, description: 'Hermandad no encontrada' })
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.hermandadesService.findOne(id);
    }

    // ==========================================
    // RUTAS PRIVADAS (Requieren login/token)
    // ==========================================

    @ApiOperation({ summary: 'Crear una nueva hermandad' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Hermandad creada correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard) // ✅ Añadido aquí
    create(@Body() createHermandadeDto: CreateHermandadDto) {
        console.log('Creating hermandad with data:', createHermandadeDto);
        return this.hermandadesService.create(createHermandadeDto);
    }

    @ApiOperation({ summary: 'Actualizar el perfil de una hermandad' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Hermandad actualizada correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
    @ApiResponse({ status: 404, description: 'Hermandad no encontrada' })
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard) // ✅ Actualizado
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateHermandadDto,
        @Req() req,
    ) {
        return this.hermandadesService.updatePerfil(id, updateDto, req.user!);
    }

    @ApiOperation({ summary: 'Eliminar una hermandad (solo administrador)' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Hermandad eliminada correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard) // ✅ Añadido aquí
    @Roles(RolUsuario.ADMIN) // Opcional: Solo un admin debería poder borrar una hermandad
    remove(@Param('id') id: string) {
        return this.hermandadesService.remove(+id);
    }

    @ApiOperation({ summary: 'Subir el logo de una hermandad' })
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: 'Logo actualizado correctamente' })
    @ApiResponse({
        status: 400,
        description: 'No se proporcionó ningún archivo válido',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post(':id/logo')
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard) // ✅ Actualizado
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                    return cb(
                        new BadRequestException('Solo se permiten imágenes'),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    async uploadLogo(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file)
            throw new BadRequestException('No se ha subido ningún archivo');

        const archivo = await this.archivosService.store({
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
        });

        return this.hermandadesService.updateLogo(
            id,
            this.archivosService.publicPath(archivo.id),
            archivo.id,
        );
    }

    @ApiOperation({
        summary: 'Verificar o desverificar una hermandad (solo administrador)',
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Estado de verificación actualizado',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
    @Patch(':id/verificar')
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard) // ✅ Actualizado
    @Roles(RolUsuario.ADMIN)
    verificar(
        @Param('id', ParseIntPipe) id: number,
        @Body('verificada') verificada: boolean,
    ) {
        return this.hermandadesService.verificar(id, verificada);
    }

    // --- Galería multimedia ---

    @ApiOperation({ summary: 'Obtener la galería multimedia de una hermandad' })
    @ApiResponse({ status: 200, description: 'Lista de items multimedia' })
    @Get(':id/galeria')
    getGaleria(@Param('id', ParseIntPipe) id: number) {
        return this.mediaService.findByHermandad(id);
    }

    @ApiOperation({
        summary: 'Subir una foto/vídeo a la galería de una hermandad',
    })
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: 'Media añadido correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post(':id/galeria')
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            fileFilter: (req, file, cb) => {
                if (
                    !file.mimetype.match(
                        /\/(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm)$/,
                    )
                ) {
                    return cb(
                        new BadRequestException(
                            'Formato de archivo no permitido',
                        ),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    async addGaleria(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { titulo?: string; descripcion?: string; anio?: string },
        @Req() req,
    ) {
        if (!file)
            throw new BadRequestException('No se ha subido ningún archivo');
        const archivo = await this.archivosService.store({
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
        });
        const tipo = file.mimetype.startsWith('video/')
            ? TipoMedia.VIDEO
            : TipoMedia.FOTO;
        return this.mediaService.create(
            {
                hermandadId: id,
                titulo: body.titulo,
                descripcion: body.descripcion,
                anio: body.anio ? Number.parseInt(body.anio, 10) : undefined,
            },
            this.archivosService.publicPath(archivo.id),
            tipo,
            req.user!.id,
            archivo.id,
        );
    }

    @ApiOperation({
        summary: 'Eliminar un item de la galería de una hermandad',
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Media eliminado correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Delete(':id/galeria/:itemId')
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    removeGaleria(@Param('itemId', ParseIntPipe) itemId: number, @Req() req: Request) {
        return this.mediaService.remove(itemId, req.user!);
    }
}

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
    Put,
    Query,
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
import { BandasService } from './bandas.service';
import { CreateBandaDto } from './dto/create-banda.dto';
import { UpdateBandaDto } from './dto/update-banda.dto';

interface AuthRequest extends Request {
    user: { id: number; username: string; rol: string };
}
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';
import { CreateEventoDto } from '@backend/eventos/dto/create-evento.dto';
import { UpdateEventoDto } from '@backend/eventos/dto/update-evento.dto';
import { NotBlockedGuard } from '@backend/auth/guards/not-blocked.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ArchivosService } from '@backend/archivos/archivos.service';
import { MediaService } from '@backend/media/media.service';
import { TipoMedia } from '@backend/media/entities/media-item.entity';
import { CreateEnlaceDto } from './dto/create-enlace.dto';

@ApiTags('bandas')
@Controller('bandas')
@UseGuards(NotBlockedGuard)
export class BandasController {
    constructor(
        private readonly bandasService: BandasService,
        private readonly archivosService: ArchivosService,
        private readonly mediaService: MediaService,
    ) {}

    @ApiOperation({ summary: 'Crear una nueva banda' })
    @ApiResponse({ status: 201, description: 'Banda creada correctamente' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    @Post()
    create(@Body() createBandaDto: CreateBandaDto) {
        return this.bandasService.create(createBandaDto);
    }

    @ApiOperation({ summary: 'Listar todas las bandas' })
    @ApiResponse({ status: 200, description: 'Lista de bandas' })
    @Get()
    findAll() {
        return this.bandasService.findAll();
    }

    @ApiOperation({ summary: 'Buscar bandas por nombre' })
    @ApiResponse({ status: 200, description: 'Lista de bandas que coinciden con la búsqueda' })
    @Get('buscar')
    buscar(@Query('nombre') nombre?: string) {
        return this.bandasService.buscar(nombre ?? '');
    }

    @ApiOperation({ summary: 'Obtener bandas de una ciudad por ID de ciudad' })
    @ApiResponse({ status: 200, description: 'Lista de bandas de la ciudad' })
    @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
    @Get('ciudad/:id')
    findByCiudad(@Param('id', ParseIntPipe) id: number) {
        return this.bandasService.findAllByCiudad(id);
    }

    @ApiOperation({ summary: 'Obtener la banda del usuario autenticado' })
    @ApiBearerAuth('access-token')
    @Get('mi-banda')
    @UseGuards(JwtAuthGuard)
    findMia(@Req() req: Request) {
        return this.bandasService.findByUsuario((req.user as any).id);
    }

    @ApiOperation({ summary: 'Obtener una banda por ID' })
    @ApiResponse({ status: 200, description: 'Datos de la banda' })
    @ApiResponse({ status: 404, description: 'Banda no encontrada' })
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.bandasService.findOne(id);
    }

    @ApiOperation({ summary: 'Actualizar los datos de una banda' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Banda actualizada correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
    @ApiResponse({ status: 404, description: 'Banda no encontrada' })
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
    update(
        @Param('id') id: string,
        @Body() updateBandaDto: UpdateBandaDto,
        @Req() req: AuthRequest,
    ) {
        return this.bandasService.update(+id, updateBandaDto, req.user!);
    }

    @ApiOperation({ summary: 'Eliminar una banda' })
    @ApiResponse({ status: 200, description: 'Banda eliminada correctamente' })
    @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
    @Delete(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
    remove(@Param('id') id: string) {
        return this.bandasService.remove(+id);
    }

    @ApiOperation({ summary: 'Crear un evento en la agenda de una banda' })
    @ApiResponse({ status: 201, description: 'Evento creado correctamente' })
    @ApiResponse({ status: 404, description: 'Banda no encontrada' })
    @Post('/:id/eventos')
    crearEvento(
        @Param('id', ParseIntPipe) id: number,
        @Body() createEventoDto: CreateEventoDto,
    ) {
        return this.bandasService.crearEvento(id, createEventoDto);
    }

    @ApiOperation({ summary: 'Ver la agenda de eventos de una banda' })
    @ApiResponse({ status: 200, description: 'Lista de eventos de la banda' })
    @ApiResponse({ status: 404, description: 'Banda no encontrada' })
    @Get(':id/eventos')
    verAgenda(@Param('id', ParseIntPipe) id: number) {
        return this.bandasService.obtenerEventos(id);
    }

    @ApiOperation({ summary: 'Obtener la agenda de una banda por año' })
    @ApiResponse({ status: 200, description: 'Agenda del año especificado' })
    @Get(':id/agenda/:anio')
    getAgenda(@Param('id') id: string, @Param('anio') anio: string) {
        return this.bandasService.findAgenda(+id, +anio);
    }

    @ApiOperation({ summary: 'Actualizar un evento de la agenda de una banda' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Evento actualizado correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
    @ApiResponse({ status: 404, description: 'Evento o banda no encontrado' })
    @Put(':id/eventos/:eventoId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
    actualizarEvento(
        @Param('id', ParseIntPipe) id: number,
        @Param('eventoId', ParseIntPipe) eventoId: number,
        @Body() dto: UpdateEventoDto,
        @Req() req: AuthRequest,
    ) {
        return this.bandasService.actualizarEvento(id, eventoId, dto, req.user!);
    }

    @ApiOperation({ summary: 'Eliminar un evento de la agenda de una banda' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Evento eliminado correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
    @Delete(':id/eventos/:eventoId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
    eliminarEvento(
        @Param('id', ParseIntPipe) id: number,
        @Param('eventoId', ParseIntPipe) eventoId: number,
        @Req() req: AuthRequest,
    ) {
        return this.bandasService.eliminarEvento(id, eventoId, req.user!);
    }

    @ApiOperation({ summary: 'Subir el logo de una banda' })
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: 'Logo actualizado correctamente' })
    @Post(':id/logo')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
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
    async uploadLogo(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('No se ha subido ningún archivo');
        const archivo = await this.archivosService.store({
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
        });
        return this.bandasService.updateLogo(id, this.archivosService.publicPath(archivo.id));
    }

    @ApiOperation({
        summary: 'Verificar o desverificar una banda (solo administrador)',
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Estado de verificación actualizado',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
    @Patch(':id/verificar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN)
    verificar(@Param('id') id: string, @Body() body: { estado: boolean }) {
        return this.bandasService.verificar(+id, body.estado);
    }

    // --- Galería multimedia ---

    @ApiOperation({ summary: 'Obtener la galería multimedia de una banda' })
    @ApiResponse({ status: 200, description: 'Lista de items multimedia' })
    @Get(':id/galeria')
    getGaleria(@Param('id', ParseIntPipe) id: number) {
        return this.mediaService.findByBanda(id);
    }

    @ApiOperation({ summary: 'Subir una foto/vídeo a la galería de una banda' })
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: 'Media añadido correctamente' })
    @Post(':id/galeria')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
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
                bandaId: id,
                titulo: body.titulo,
                descripcion: body.descripcion,
                anio: body.anio
                    ? Number.parseInt(body.anio, 10)
                    : new Date().getFullYear(),
            },
            this.archivosService.publicPath(archivo.id),
            tipo,
            req.user!.id,
            archivo.id,
        );
    }

    @ApiOperation({ summary: 'Eliminar un item de la galería de una banda' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Media eliminado correctamente' })
    @Delete(':id/galeria/:itemId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
    removeGaleria(@Param('itemId', ParseIntPipe) itemId: number, @Req() req: AuthRequest) {
        return this.mediaService.remove(itemId, req.user!);
    }

    // --- Enlaces externos ---

    @ApiOperation({ summary: 'Obtener los enlaces externos de una banda' })
    @ApiResponse({ status: 200, description: 'Lista de enlaces' })
    @Get(':id/enlaces')
    getEnlaces(@Param('id', ParseIntPipe) id: number) {
        return this.bandasService.getEnlaces(id);
    }

    @ApiOperation({ summary: 'Añadir un enlace externo a una banda' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Enlace añadido correctamente' })
    @Post(':id/enlaces')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
    addEnlace(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateEnlaceDto,
    ) {
        return this.bandasService.addEnlace(id, dto);
    }

    @ApiOperation({ summary: 'Eliminar un enlace externo de una banda' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Enlace eliminado correctamente' })
    @Delete(':id/enlaces/:enlaceId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
    removeEnlace(
        @Param('enlaceId', ParseIntPipe) enlaceId: number,
        @Req() req,
    ) {
        return this.bandasService.removeEnlace(enlaceId, req.user!);
    }
}

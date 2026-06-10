import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { CreateMediaItemDto } from './dto/create-media-item.dto';
import { TipoMedia } from './entities/media-item.entity';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { NotBlockedGuard } from '@backend/auth/guards/not-blocked.guard';
import { ArchivosService } from '@backend/archivos/archivos.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
    constructor(
        private readonly service: MediaService,
        private readonly archivosService: ArchivosService,
    ) {}

    @ApiOperation({ summary: 'Subir foto o vídeo con etiquetas' })
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @Post('upload')
    @UseGuards(JwtAuthGuard, NotBlockedGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            fileFilter: (req, file, cb) => {
                const allowed = /\/(jpg|jpeg|png|gif|webp|mp4|webm|mov|avi)$/;
                if (!file.mimetype.match(allowed)) {
                    return cb(new BadRequestException('Formato no permitido. Usa jpg, png, gif, webp, mp4 o webm.'), false);
                }
                cb(null, true);
            },
            limits: { fileSize: 100 * 1024 * 1024 },
        }),
    )
    async uploadMedia(
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: CreateMediaItemDto,
        @Req() req: any,
    ) {
        if (!file) throw new BadRequestException('No se ha subido ningún archivo');
        const tipo = file.mimetype.startsWith('video') ? TipoMedia.VIDEO : TipoMedia.FOTO;

        const archivo = await this.archivosService.store({
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
        });

        return this.service.create(
            dto,
            this.archivosService.publicPath(archivo.id),
            tipo,
            req.user.id,
            archivo.id,
        );
    }

    @ApiOperation({ summary: 'Añadir enlace externo (YouTube, Spotify, etc.)' })
    @ApiBearerAuth('access-token')
    @Post('enlace')
    @UseGuards(JwtAuthGuard, NotBlockedGuard)
    async addEnlace(@Body() dto: CreateMediaItemDto, @Req() req: any) {
        if (!dto.url) throw new BadRequestException('Se requiere la URL del enlace');
        return this.service.create(dto, dto.url, TipoMedia.ENLACE, req.user.id);
    }

    @ApiOperation({ summary: 'Obtener media de una hermandad' })
    @Get('hermandad/:id')
    findByHermandad(@Param('id', ParseIntPipe) id: number) {
        return this.service.findByHermandad(id);
    }

    @ApiOperation({ summary: 'Obtener media de una banda' })
    @Get('banda/:id')
    findByBanda(@Param('id', ParseIntPipe) id: number) {
        return this.service.findByBanda(id);
    }

    @ApiOperation({ summary: 'Obtener media público con filtros opcionales' })
    @Get()
    findPublicos(
        @Query('hermandadId') hermandadId?: string,
        @Query('bandaId') bandaId?: string,
        @Query('ciudadId') ciudadId?: string,
        @Query('anio') anio?: string,
    ) {
        return this.service.findPublicos({
            hermandadId: hermandadId ? +hermandadId : undefined,
            bandaId: bandaId ? +bandaId : undefined,
            ciudadId: ciudadId ? +ciudadId : undefined,
            anio: anio ? +anio : undefined,
        });
    }

    @ApiOperation({ summary: 'Eliminar un item de media' })
    @ApiBearerAuth('access-token')
    @Delete(':id')
    @UseGuards(JwtAuthGuard, NotBlockedGuard)
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.remove(id, req.user);
    }
}

import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { PublicacionesService } from './publicaciones.service';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { JwtOptionalGuard } from '@backend/auth/jwt-optional.guard';
import { IsNotEmpty, IsString } from 'class-validator';

class CreateComentarioDto {
    @IsString()
    @IsNotEmpty()
    contenido: string;
}

@ApiTags('publicaciones')
@Controller('publicaciones')
export class PublicacionesController {
    constructor(private readonly service: PublicacionesService) {}

    @ApiOperation({ summary: 'Crear una nueva publicación' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 201,
        description: 'Publicación creada correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() dto: CreatePublicacionDto, @Req() req: any) {
        return this.service.create(dto, req.user);
    }

    @ApiOperation({
        summary: 'Obtener el feed general de publicaciones recientes',
    })
    @ApiResponse({
        status: 200,
        description: 'Lista paginada de publicaciones generales',
    })
    @Get('general')
    @UseGuards(JwtOptionalGuard)
    getGeneral(
        @Req() req: any,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ) {
        const userId = req.user?.id;
        return this.service.getGeneral(userId, +page, +limit);
    }

    @ApiOperation({
        summary:
            'Obtener el feed personalizado de hermandades y bandas seguidas',
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Lista paginada de publicaciones del feed',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Get('feed')
    @UseGuards(JwtAuthGuard)
    getFeed(
        @Req() req: any,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ) {
        return this.service.getFeed(req.user.id, +page, +limit);
    }

    @ApiOperation({ summary: 'Obtener publicaciones de una hermandad' })
    @ApiResponse({
        status: 200,
        description: 'Lista de publicaciones de la hermandad',
    })
    @Get('hermandad/:id')
    findByHermandad(@Param('id', ParseIntPipe) id: number) {
        return this.service.findByHermandad(id);
    }

    @ApiOperation({ summary: 'Obtener publicaciones de una banda' })
    @ApiResponse({
        status: 200,
        description: 'Lista de publicaciones de la banda',
    })
    @Get('banda/:id')
    findByBanda(@Param('id', ParseIntPipe) id: number) {
        return this.service.findByBanda(id);
    }

    @ApiOperation({ summary: 'Obtener publicaciones de un usuario' })
    @ApiResponse({
        status: 200,
        description: 'Lista de publicaciones del usuario',
    })
    @Get('usuario/:id')
    findByUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.service.findByUsuario(id);
    }

    @ApiOperation({ summary: 'Eliminar una publicación' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Publicación eliminada correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 403,
        description: 'Sin permisos para eliminar esta publicación',
    })
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.remove(id, req.user);
    }

    // ── Me gusta ─────────────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Dar o quitar me gusta a una publicación' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Estado de me gusta actualizado' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    toggleLike(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.toggleLike(req.user.id, id);
    }

    @ApiOperation({
        summary: 'Obtener el estado de me gusta de una publicación',
    })
    @ApiResponse({
        status: 200,
        description: 'Estado de me gusta y total de likes',
    })
    @Get(':id/like')
    getLike(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        const userId = req.user?.id;
        return this.service.getLike(id, userId);
    }

    // ── Comentarios ──────────────────────────────────────────────────────────

    @ApiOperation({ summary: 'Obtener los comentarios de una publicación' })
    @ApiResponse({ status: 200, description: 'Lista de comentarios' })
    @Get(':publicacionId/comentarios')
    getComentarios(
        @Param('publicacionId', ParseIntPipe) publicacionId: number,
    ) {
        return this.service.getComentarios(publicacionId);
    }

    @ApiOperation({ summary: 'Añadir un comentario a una publicación' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 201,
        description: 'Comentario añadido correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post(':publicacionId/comentarios')
    @UseGuards(JwtAuthGuard)
    crearComentario(
        @Param('publicacionId', ParseIntPipe) publicacionId: number,
        @Body() dto: CreateComentarioDto,
        @Req() req: any,
    ) {
        return this.service.crearComentario(
            req.user.id,
            publicacionId,
            dto.contenido,
        );
    }

    @ApiOperation({ summary: 'Eliminar un comentario de una publicación' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Comentario eliminado correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({
        status: 403,
        description: 'Sin permisos para eliminar este comentario',
    })
    @Delete(':publicacionId/comentarios/:id')
    @UseGuards(JwtAuthGuard)
    eliminarComentario(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.eliminarComentario(id, req.user);
    }
}

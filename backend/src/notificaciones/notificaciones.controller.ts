import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { TipoNotificacion } from './entities/notificacion.entity';

@ApiTags('notificaciones')
@ApiBearerAuth('access-token')
@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
    constructor(private readonly service: NotificacionesService) {}

    @ApiOperation({ summary: 'Obtener mis notificaciones' })
    @Get()
    getMias(@Req() req: any) {
        return this.service.getMisNotificaciones(req.user.id);
    }

    @ApiOperation({ summary: 'Marcar una notificación como leída' })
    @Patch(':id/leida')
    marcarLeida(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.marcarLeida(id, req.user.id);
    }

    @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
    @Patch('leidas/todas')
    marcarTodasLeidas(@Req() req: any) {
        return this.service.marcarTodasLeidas(req.user.id);
    }

    @ApiOperation({ summary: 'Eliminar una notificación' })
    @Delete(':id')
    eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.eliminar(id, req.user.id);
    }

    @ApiOperation({ summary: 'Suscribirse a push notifications' })
    @Post('push/suscribir')
    suscribir(
        @Req() req: any,
        @Body()
        body: { endpoint: string; keys: { p256dh: string; auth: string } },
    ) {
        return this.service.suscribir(req.user.id, body);
    }

    @ApiOperation({ summary: 'Desuscribirse de push notifications' })
    @Post('push/desuscribir')
    desuscribir(@Req() req: any, @Body() body: { endpoint: string }) {
        return this.service.desuscribir(req.user.id, body.endpoint);
    }

    @ApiOperation({ summary: 'Obtener mis eventos importantes' })
    @Get('eventos-importantes')
    getEventosImportantes(@Req() req: any) {
        return this.service.getEventosImportantes(req.user.id);
    }

    @ApiOperation({ summary: 'Marcar un evento como importante' })
    @Post('eventos-importantes')
    marcarImportante(
        @Req() req: any,
        @Body() body: { eventoTipo: string; eventoId: number; titulo?: string },
    ) {
        return this.service.marcarEventoImportante(
            req.user.id,
            body.eventoTipo,
            body.eventoId,
            body.titulo,
        );
    }

    @ApiOperation({ summary: 'Desmarcar un evento como importante' })
    @Delete('eventos-importantes/:tipo/:id')
    desmarcarImportante(
        @Req() req: any,
        @Param('tipo') tipo: string,
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.service.desmarcarEventoImportante(req.user.id, tipo, id);
    }

    @ApiOperation({ summary: 'Enviar una notificación (uso interno / admin)' })
    @Post('enviar')
    enviar(
        @Body()
        body: {
            usuarioId: number;
            tipo: TipoNotificacion;
            titulo: string;
            cuerpo?: string;
            urlDestino?: string;
        },
    ) {
        return this.service.crearNotificacion(
            body.usuarioId,
            body.tipo,
            body.titulo,
            body.cuerpo,
            body.urlDestino,
        );
    }
}

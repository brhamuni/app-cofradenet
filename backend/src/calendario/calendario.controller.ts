import { Controller, Get, Query, Req, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CalendarioService, TipoFiltro } from './calendario.service';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';

@ApiTags('calendario')
@Controller('calendario')
export class CalendarioController {
    constructor(private readonly service: CalendarioService) {}

    @ApiOperation({ summary: 'Obtener mis eventos del calendario (de hermandades y bandas seguidas)' })
    @ApiBearerAuth('access-token')
    @Get('mis-eventos')
    @UseGuards(JwtAuthGuard)
    getMisEventos(
        @Req() req: any,
        @Query('tipo') tipo: TipoFiltro = 'all',
        @Query('ciudadId') ciudadId?: string,
    ) {
        return this.service.getMisEventos(req.user.id, tipo, ciudadId ? +ciudadId : undefined);
    }

    @ApiOperation({ summary: 'Exportar mis eventos como archivo ICS' })
    @ApiBearerAuth('access-token')
    @Get('exportar-ics')
    @UseGuards(JwtAuthGuard)
    async exportarIcs(
        @Req() req: any,
        @Query('tipo') tipo: TipoFiltro = 'all',
        @Query('ciudadId') ciudadId?: string,
        @Res() res?: Response,
    ) {
        const eventos = await this.service.getMisEventos(req.user.id, tipo, ciudadId ? +ciudadId : undefined);
        const ics = buildIcsContent(eventos);
        res!.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res!.setHeader('Content-Disposition', 'attachment; filename="mi-calendario-cofradenet.ics"');
        res!.send(ics);
    }
}

function padIcsDate(date: Date): string {
    const y = date.getUTCFullYear();
    const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    const mi = String(date.getUTCMinutes()).padStart(2, '0');
    return `${y}${mo}${d}T${h}${mi}00Z`;
}

function icsEscape(str: string): string {
    return (str ?? '').replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
}

function buildIcsContent(eventos: any[]): string {
    const lines: string[] = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//CofradeNet//Calendario//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:CofradeNet - Mi Calendario',
    ];

    for (const ev of eventos) {
        const dtstart = padIcsDate(new Date(ev.fecha));
        const dtend = padIcsDate(new Date(new Date(ev.fecha).getTime() + 3600000));
        const summary = icsEscape(ev.titulo);
        const location = icsEscape(ev.lugar || ev.ciudad || '');
        const description = icsEscape(
            ev.tipo === 'procesion'
                ? `Procesión de ${ev.hermandad?.nombrePopular || ev.hermandad?.nombre || ''}`
                : `Concierto de ${ev.banda?.nombre || ''}`,
        );
        lines.push(
            'BEGIN:VEVENT',
            `UID:cofradenet-${ev.tipo}-${ev.id}@cofradenet.es`,
            `DTSTART:${dtstart}`,
            `DTEND:${dtend}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${location}`,
            'END:VEVENT',
        );
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
}

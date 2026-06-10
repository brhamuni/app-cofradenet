import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ArchivosService } from './archivos.service';

@ApiTags('archivos')
@Controller('archivos')
export class ArchivosController {
    constructor(private readonly archivosService: ArchivosService) {}

    @ApiOperation({ summary: 'Descargar/visualizar un archivo subido' })
    @Get(':id')
    async serve(@Param('id') id: string, @Res() res: Response) {
        try {
            const { archivo, stream } = await this.archivosService.getStream(id);
            res.setHeader('Content-Type', archivo.mimeType);
            if (archivo.originalName) {
                res.setHeader(
                    'Content-Disposition',
                    `inline; filename="${archivo.originalName}"`,
                );
            }
            stream.pipe(res);
        } catch {
            throw new NotFoundException('Archivo no encontrado');
        }
    }
}

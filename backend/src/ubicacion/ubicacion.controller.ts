import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UbicacionService } from './ubicacion.service';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';
import { CreateEstadoPasoDto } from './dto/create-estado-paso.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { NotBlockedGuard } from '@backend/auth/guards/not-blocked.guard';

@ApiTags('ubicacion')
@Controller('ubicacion')
export class UbicacionController {
    constructor(private readonly service: UbicacionService) {}

    @ApiOperation({ summary: 'Obtener ubicaciones activas de procesiones en tiempo real' })
    @Get('activas')
    getActivas() {
        return this.service.getActivas();
    }

    @ApiOperation({ summary: 'Obtener ubicación de una procesión' })
    @Get('procesion/:procesionId')
    getByProcesion(@Param('procesionId', ParseIntPipe) procesionId: number) {
        return this.service.getByProcesion(procesionId);
    }

    @ApiOperation({ summary: 'Actualizar ubicación en tiempo real (admin hermandad)' })
    @ApiBearerAuth('access-token')
    @Patch('procesion/:procesionId')
    @UseGuards(JwtAuthGuard, NotBlockedGuard)
    updateUbicacion(
        @Param('procesionId', ParseIntPipe) procesionId: number,
        @Body() dto: UpdateUbicacionDto,
        @Req() req: any,
    ) {
        return this.service.updateUbicacion(procesionId, dto, req.user);
    }

    @ApiOperation({ summary: 'Añadir estado de paso (usuario registrado)' })
    @ApiBearerAuth('access-token')
    @Post('procesion/:procesionId/estados')
    @UseGuards(JwtAuthGuard, NotBlockedGuard)
    createEstadoPaso(
        @Param('procesionId', ParseIntPipe) procesionId: number,
        @Body() dto: CreateEstadoPasoDto,
        @Req() req: any,
    ) {
        return this.service.createEstadoPaso(procesionId, dto, req.user.id);
    }

    @ApiOperation({ summary: 'Obtener estados de paso de una procesión' })
    @Get('procesion/:procesionId/estados')
    getEstadosPaso(@Param('procesionId', ParseIntPipe) procesionId: number) {
        return this.service.getEstadosPaso(procesionId);
    }
}

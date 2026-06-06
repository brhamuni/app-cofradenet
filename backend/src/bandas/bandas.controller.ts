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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BandasService } from './bandas.service';
import { CreateBandaDto } from './dto/create-banda.dto';
import { UpdateBandaDto } from './dto/update-banda.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario, Usuario } from '@backend/usuarios/entities/usuario.entity';
import { CreateEventoDto } from '@backend/eventos/dto/create-evento.dto';
import { UpdateEventoDto } from '@backend/eventos/dto/update-evento.dto';
import { NotBlockedGuard } from '@backend/auth/guards/not-blocked.guard';

@ApiTags('bandas')
@Controller('bandas')
@UseGuards(NotBlockedGuard)
export class BandasController {
    constructor(private readonly bandasService: BandasService) {}

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

    @ApiOperation({ summary: 'Obtener bandas de una ciudad por ID de ciudad' })
    @ApiResponse({ status: 200, description: 'Lista de bandas de la ciudad' })
    @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
    @Get('ciudad/:id')
    findByCiudad(@Param('id', ParseIntPipe) id: number) {
        return this.bandasService.findAllByCiudad(id);
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
    @ApiResponse({ status: 200, description: 'Banda actualizada correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
    @ApiResponse({ status: 404, description: 'Banda no encontrada' })
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
    update(
        @Param('id') id: string,
        @Body() updateBandaDto: UpdateBandaDto,
        @Req() req: { user: Usuario },
    ) {
        return this.bandasService.update(+id, updateBandaDto, req.user);
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
    @ApiResponse({ status: 200, description: 'Evento actualizado correctamente' })
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
        @Req() req: { user: Usuario },
    ) {
        return this.bandasService.actualizarEvento(id, eventoId, dto, req.user);
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
        @Req() req: { user: Usuario },
    ) {
        return this.bandasService.eliminarEvento(id, eventoId, req.user);
    }

    @ApiOperation({ summary: 'Verificar o desverificar una banda (solo administrador)' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Estado de verificación actualizado' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
    @Patch(':id/verificar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN)
    verificar(@Param('id') id: string, @Body() body: { estado: boolean }) {
        return this.bandasService.verificar(+id, body.estado);
    }
}

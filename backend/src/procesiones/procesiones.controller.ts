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
    Query,
    ParseIntPipe,
    Put,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ProcesionesService } from './procesiones.service';
import { CreateProcesionDto } from './dto/create-procesion.dto';
import { UpdateProcesionDto } from './dto/update-procesion.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';
import { UbicacionService } from '@backend/ubicacion/ubicacion.service';
import { UpdateUbicacionDto } from '@backend/ubicacion/dto/update-ubicacion.dto';
import { CreateEstadoPasoDto } from '@backend/ubicacion/dto/create-estado-paso.dto';
import { NotBlockedGuard } from '@backend/auth/guards/not-blocked.guard';

@ApiTags('procesiones')
@Controller('procesiones')
export class ProcesionesController {
    constructor(
        private readonly procesionesService: ProcesionesService,
        private readonly ubicacionService: UbicacionService,
    ) {}

    @ApiOperation({ summary: 'Crear una nueva procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Procesión creada correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    create(@Body() createProcesionDto: CreateProcesionDto, @Req() req) {
        return this.procesionesService.create(createProcesionDto, req.user);
    }

    @ApiOperation({ summary: 'Listar todas las procesiones' })
    @ApiResponse({ status: 200, description: 'Lista de procesiones' })
    @Get()
    findAll() {
        return this.procesionesService.findAll();
    }

    @ApiOperation({
        summary:
            'Buscar procesiones por filtros (ciudad, día, nombre, hermandad, banda)',
    })
    @ApiResponse({
        status: 200,
        description: 'Procesiones que coinciden con los filtros',
    })
    @Get('buscar')
    buscar(
        @Query('ciudad') ciudad?: string,
        @Query('dia') diaSemana?: string,
        @Query('nombre') nombre?: string,
        @Query('hermandad') hermandad?: string,
        @Query('banda') banda?: string,
    ) {
        return this.procesionesService.buscarProcesiones(
            ciudad,
            diaSemana,
            nombre,
            hermandad,
            banda,
        );
    }

    @ApiOperation({
        summary: 'Obtener todas las procesiones activas con ubicación',
    })
    @ApiResponse({ status: 200, description: 'Lista de procesiones activas' })
    @Get('activas')
    getProcesionesActivas() {
        return this.ubicacionService.getActivas();
    }

    @ApiOperation({ summary: 'Obtener procesiones de una hermandad por ID' })
    @ApiResponse({ status: 200, description: 'Procesiones de la hermandad' })
    @ApiResponse({ status: 404, description: 'Hermandad no encontrada' })
    @Get('/hermandad/:id')
    async findProcesionHermandad(@Param('id', ParseIntPipe) id: number) {
        return this.procesionesService.buscarPorHermandad(id);
    }

    @ApiOperation({ summary: 'Obtener una procesión por ID' })
    @ApiResponse({ status: 200, description: 'Datos de la procesión' })
    @ApiResponse({ status: 404, description: 'Procesión no encontrada' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.procesionesService.findOne(+id);
    }

    @ApiOperation({ summary: 'Actualizar los datos de una procesión' })
    @ApiResponse({
        status: 200,
        description: 'Procesión actualizada correctamente',
    })
    @ApiResponse({ status: 404, description: 'Procesión no encontrada' })
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateProcesionDto: UpdateProcesionDto,
    ) {
        return this.procesionesService.update(+id, updateProcesionDto);
    }

    @ApiOperation({ summary: 'Eliminar una procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Procesión eliminada correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.procesionesService.remove(id, req.user);
    }

    @ApiOperation({ summary: 'Asignar una banda a una procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Banda asignada correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post(':id/asignar-banda')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    asignarBanda(
        @Param('id', ParseIntPipe) procesionId: number,
        @Body() body: { bandaId: number; anio: number; ubicacion: string },
    ) {
        return this.procesionesService.asignarBanda(
            procesionId,
            body.bandaId,
            body.anio,
            body.ubicacion,
        );
    }

    @ApiOperation({
        summary: 'Obtener la ficha completa de una procesión en un año',
    })
    @ApiResponse({
        status: 200,
        description: 'Ficha completa de la procesión para el año indicado',
    })
    @ApiResponse({ status: 404, description: 'Procesión no encontrada' })
    @Get(':id/ficha/:anio')
    obtenerFichaCompleta(
        @Param('id', ParseIntPipe) id: number,
        @Param('anio', ParseIntPipe) anio: number,
    ) {
        return this.procesionesService.obtenerFichaPorAnio(id, anio);
    }

    // --- Participaciones (HUR-07) ---

    @ApiOperation({
        summary: 'Obtener las participaciones de bandas en una procesión',
    })
    @ApiResponse({ status: 200, description: 'Lista de participaciones' })
    @Get(':id/participaciones')
    getParticipaciones(@Param('id', ParseIntPipe) id: number) {
        return this.procesionesService.getParticipaciones(id);
    }

    @ApiOperation({
        summary: 'Añadir una participación de banda a una procesión',
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 201,
        description: 'Participación añadida correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post(':id/participaciones')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    addParticipacion(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { bandaId: number; anio: number; ubicacion?: string },
    ) {
        return this.procesionesService.addParticipacion(id, body);
    }

    @ApiOperation({ summary: 'Actualizar una participación de una procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Participación actualizada correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Put(':id/participaciones/:pid')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    updateParticipacion(
        @Param('id', ParseIntPipe) _id: number,
        @Param('pid', ParseIntPipe) pid: number,
        @Body()
        body: Partial<{ bandaId: number; anio: number; ubicacion: string }>,
    ) {
        return this.procesionesService.updateParticipacion(pid, body);
    }

    @ApiOperation({ summary: 'Eliminar una participación de una procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Participación eliminada correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Delete(':id/participaciones/:pid')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    removeParticipacion(
        @Param('id', ParseIntPipe) _id: number,
        @Param('pid', ParseIntPipe) pid: number,
    ) {
        return this.procesionesService.removeParticipacion(pid);
    }

    // --- Itinerario (HUAH-02) ---

    @ApiOperation({ summary: 'Obtener los itinerarios de una procesión' })
    @ApiResponse({ status: 200, description: 'Lista de itinerarios' })
    @Get(':id/itinerario')
    getItinerarios(@Param('id', ParseIntPipe) id: number) {
        return this.procesionesService.getItinerarios(id);
    }

    @ApiOperation({ summary: 'Crear un itinerario para una procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 201,
        description: 'Itinerario creado correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post(':id/itinerario')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    createItinerario(
        @Param('id', ParseIntPipe) id: number,
        @Body()
        body: {
            anio: number;
            horarioSalida?: string;
            horarioEntrada?: string;
            recorrido?: string;
        },
    ) {
        return this.procesionesService.createItinerario(id, body);
    }

    @ApiOperation({ summary: 'Actualizar el itinerario de una procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Itinerario actualizado correctamente',
    })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Put(':id/itinerario')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    updateItinerario(
        @Param('id', ParseIntPipe) _id: number,
        @Body()
        body: {
            itinerarioId: number;
            horarioSalida?: string;
            horarioEntrada?: string;
            recorrido?: string;
        },
    ) {
        const { itinerarioId, ...updates } = body;
        return this.procesionesService.updateItinerario(itinerarioId, updates);
    }

    // --- Pasos (HUAH-02) ---

    @ApiOperation({ summary: 'Crear un paso en una procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Paso creado correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post(':id/pasos')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    createPaso(
        @Param('id', ParseIntPipe) id: number,
        @Body()
        body: {
            nombre: string;
            tipo?: string;
            orden?: number;
            descripcion?: string;
        },
    ) {
        return this.procesionesService.createPaso(id, body);
    }

    @ApiOperation({ summary: 'Actualizar un paso de una procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Paso actualizado correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Put(':id/pasos/:pasoId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    updatePaso(
        @Param('id', ParseIntPipe) _id: number,
        @Param('pasoId', ParseIntPipe) pasoId: number,
        @Body()
        body: Partial<{
            nombre: string;
            tipo: string;
            orden: number;
            descripcion: string;
        }>,
    ) {
        return this.procesionesService.updatePaso(pasoId, body);
    }

    @ApiOperation({ summary: 'Eliminar un paso de una procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Paso eliminado correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Delete(':id/pasos/:pasoId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    removePaso(
        @Param('id', ParseIntPipe) _id: number,
        @Param('pasoId', ParseIntPipe) pasoId: number,
    ) {
        return this.procesionesService.removePaso(pasoId);
    }

    // --- Ubicación en tiempo real ---

    @ApiOperation({
        summary: 'Iniciar retransmisión de ubicación de una procesión',
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Retransmisión iniciada' })
    @Post(':id/ubicacion/iniciar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    iniciarUbicacion(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.ubicacionService.iniciar(id, req.user);
    }

    @ApiOperation({ summary: 'Actualizar coordenadas GPS de una procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Ubicación actualizada' })
    @Post(':id/ubicacion')
    @UseGuards(JwtAuthGuard, NotBlockedGuard)
    updateUbicacion(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUbicacionDto,
        @Req() req,
    ) {
        return this.ubicacionService.updateUbicacion(id, dto, req.user);
    }

    @ApiOperation({
        summary: 'Finalizar retransmisión de ubicación de una procesión',
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Retransmisión finalizada' })
    @HttpCode(HttpStatus.OK)
    @Delete(':id/ubicacion/finalizar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    finalizarUbicacion(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.ubicacionService.finalizar(id, req.user);
    }

    @ApiOperation({ summary: 'Obtener ubicación actual de una procesión' })
    @ApiResponse({ status: 200, description: 'Datos de ubicación' })
    @Get(':id/ubicacion')
    getUbicacion(@Param('id', ParseIntPipe) id: number) {
        return this.ubicacionService.getByProcesion(id);
    }

    // --- Estados de paso ---

    @ApiOperation({ summary: 'Obtener estados de un paso en una procesión' })
    @ApiResponse({ status: 200, description: 'Lista de estados' })
    @Get(':id/pasos/:pasoId/estados')
    getEstadosPaso(
        @Param('id', ParseIntPipe) id: number,
        @Param('pasoId', ParseIntPipe) pasoId: number,
    ) {
        return this.ubicacionService.getEstadosPaso(id, pasoId);
    }

    @ApiOperation({ summary: 'Obtener el último estado de un paso' })
    @ApiResponse({ status: 200, description: 'Último estado del paso' })
    @Get(':id/pasos/:pasoId/estados/ultimo')
    getUltimoEstadoPaso(
        @Param('id', ParseIntPipe) id: number,
        @Param('pasoId', ParseIntPipe) pasoId: number,
    ) {
        return this.ubicacionService.getUltimoEstadoPaso(id, pasoId);
    }

    @ApiOperation({ summary: 'Registrar un estado de paso en una procesión' })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 201,
        description: 'Estado registrado correctamente',
    })
    @Post(':id/pasos/:pasoId/estados')
    @UseGuards(JwtAuthGuard, NotBlockedGuard)
    createEstadoPaso(
        @Param('id', ParseIntPipe) id: number,
        @Param('pasoId', ParseIntPipe) pasoId: number,
        @Body() dto: CreateEstadoPasoDto,
        @Req() req,
    ) {
        return this.ubicacionService.createEstadoPaso(
            id,
            pasoId,
            dto,
            req.user.id,
        );
    }

    @ApiOperation({ summary: 'Eliminar un estado de paso' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Estado eliminado correctamente' })
    @Delete(':id/pasos/:pasoId/estados/:estadoId')
    @UseGuards(JwtAuthGuard, NotBlockedGuard)
    deleteEstadoPaso(
        @Param('estadoId', ParseIntPipe) estadoId: number,
        @Req() req,
    ) {
        return this.ubicacionService.deleteEstadoPaso(estadoId, req.user);
    }
}

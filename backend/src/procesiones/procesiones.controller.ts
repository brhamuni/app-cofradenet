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
} from '@nestjs/common';
import { ProcesionesService } from './procesiones.service';
import { CreateProcesionDto } from './dto/create-procesion.dto';
import { UpdateProcesionDto } from './dto/update-procesion.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';

@Controller('procesiones')
export class ProcesionesController {
    constructor(private readonly procesionesService: ProcesionesService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    create(@Body() createProcesionDto: CreateProcesionDto, @Req() req) {
        return this.procesionesService.create(createProcesionDto, req.user);
    }

    @Get()
    findAll() {
        return this.procesionesService.findAll();
    }

    @Get('buscar')
    buscar(
        @Query('ciudad') ciudad?: string,
        @Query('dia') diaSemana?: string,
        @Query('nombre') nombre?: string,
        @Query('hermandad') hermandad?: string,
        @Query('banda') banda?: string,
    ) {
        return this.procesionesService.buscarProcesiones(ciudad, diaSemana, nombre, hermandad, banda);
    }

    @Get('/hermandad/:id')
    async findProcesionHermandad(@Param('id', ParseIntPipe) id: number) {
        return this.procesionesService.buscarPorHermandad(id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.procesionesService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateProcesionDto: UpdateProcesionDto) {
        return this.procesionesService.update(+id, updateProcesionDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.procesionesService.remove(id, req.user);
    }

    @Post(':id/asignar-banda')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    asignarBanda(
        @Param('id', ParseIntPipe) procesionId: number,
        @Body() body: { bandaId: number; anio: number; ubicacion: string },
    ) {
        return this.procesionesService.asignarBanda(procesionId, body.bandaId, body.anio, body.ubicacion);
    }

    @Get(':id/ficha/:anio')
    obtenerFichaCompleta(
        @Param('id', ParseIntPipe) id: number,
        @Param('anio', ParseIntPipe) anio: number,
    ) {
        return this.procesionesService.obtenerFichaPorAnio(id, anio);
    }

    // --- Participaciones (HUR-07) ---

    @Get(':id/participaciones')
    getParticipaciones(@Param('id', ParseIntPipe) id: number) {
        return this.procesionesService.getParticipaciones(id);
    }

    @Post(':id/participaciones')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    addParticipacion(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { bandaId: number; anio: number; ubicacion?: string },
    ) {
        return this.procesionesService.addParticipacion(id, body);
    }

    @Put(':id/participaciones/:pid')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    updateParticipacion(
        @Param('id', ParseIntPipe) _id: number,
        @Param('pid', ParseIntPipe) pid: number,
        @Body() body: Partial<{ bandaId: number; anio: number; ubicacion: string }>,
    ) {
        return this.procesionesService.updateParticipacion(pid, body);
    }

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

    @Get(':id/itinerario')
    getItinerarios(@Param('id', ParseIntPipe) id: number) {
        return this.procesionesService.getItinerarios(id);
    }

    @Post(':id/itinerario')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    createItinerario(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { anio: number; horarioSalida?: string; horarioEntrada?: string; recorrido?: string },
    ) {
        return this.procesionesService.createItinerario(id, body);
    }

    @Put(':id/itinerario')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    updateItinerario(
        @Param('id', ParseIntPipe) _id: number,
        @Body() body: { itinerarioId: number; horarioSalida?: string; horarioEntrada?: string; recorrido?: string },
    ) {
        const { itinerarioId, ...updates } = body;
        return this.procesionesService.updateItinerario(itinerarioId, updates);
    }

    // --- Pasos (HUAH-02) ---

    @Post(':id/pasos')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    createPaso(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { nombre: string; tipo?: string; orden?: number; descripcion?: string },
    ) {
        return this.procesionesService.createPaso(id, body);
    }

    @Put(':id/pasos/:pasoId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    updatePaso(
        @Param('id', ParseIntPipe) _id: number,
        @Param('pasoId', ParseIntPipe) pasoId: number,
        @Body() body: Partial<{ nombre: string; tipo: string; orden: number; descripcion: string }>,
    ) {
        return this.procesionesService.updatePaso(pasoId, body);
    }

    @Delete(':id/pasos/:pasoId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    removePaso(
        @Param('id', ParseIntPipe) _id: number,
        @Param('pasoId', ParseIntPipe) pasoId: number,
    ) {
        return this.procesionesService.removePaso(pasoId);
    }
}

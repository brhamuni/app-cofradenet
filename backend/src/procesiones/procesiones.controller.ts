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
    async buscarPorCiudad(@Query('ciudadId', ParseIntPipe) ciudadId: number) {
        return this.procesionesService.buscarPorCiudad(ciudadId);
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
    update(
        @Param('id') id: string,
        @Body() updateProcesionDto: UpdateProcesionDto,
    ) {
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
        return this.procesionesService.asignarBanda(
            procesionId,
            body.bandaId,
            body.anio,
            body.ubicacion,
        );
    }

    @Get(':id/ficha/:anio')
    obtenerFichaCompleta(
        @Param('id',ParseIntPipe) id: number,
        @Param('anio',ParseIntPipe) anio: number
    ){
        return this.procesionesService.obtenerFichaPorAnio(id, anio);
    }
}

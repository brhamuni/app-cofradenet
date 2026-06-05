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

@Controller('bandas')
@UseGuards(NotBlockedGuard)
export class BandasController {
    constructor(private readonly bandasService: BandasService) {}

    @Post()
    create(@Body() createBandaDto: CreateBandaDto) {
        return this.bandasService.create(createBandaDto);
    }

    @Get()
    findAll() {
        return this.bandasService.findAll();
    }

    @Get('ciudad/:id')
    findByCiudad(@Param('id', ParseIntPipe) id: number) {
        return this.bandasService.findAllByCiudad(id);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.bandasService.findOne(id);
    }

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

    @Delete(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
    remove(@Param('id') id: string) {
        return this.bandasService.remove(+id);
    }

    @Post('/:id/eventos')
    crearEvento(
        @Param('id', ParseIntPipe) id: number,
        @Body() createEventoDto: CreateEventoDto,
    ) {
        return this.bandasService.crearEvento(id, createEventoDto);
    }

    @Get(':id/eventos')
    verAgenda(@Param('id', ParseIntPipe) id: number) {
        return this.bandasService.obtenerEventos(id);
    }

    @Get(':id/agenda/:anio')
    getAgenda(@Param('id') id: string, @Param('anio') anio: string) {
        return this.bandasService.findAgenda(+id, +anio);
    }

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

    @Patch(':id/verificar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN)
    verificar(@Param('id') id: string, @Body() body: { estado: boolean }) {
        return this.bandasService.verificar(+id, body.estado);
    }
}

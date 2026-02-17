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
} from '@nestjs/common';
import { BandasService } from './bandas.service';
import { CreateBandaDto } from './dto/create-banda.dto';
import { UpdateBandaDto } from './dto/update-banda.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';
import { CreateEventoDto } from '@backend/eventos/dto/create-evento.dto';

@Controller('bandas')
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
        @Req() req,
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
}

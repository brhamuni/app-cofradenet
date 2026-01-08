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
    async buscar(@Query('ciudadId', ParseIntPipe) ciudadId: number) {
        return this.procesionesService.buscarPorCiudad(ciudadId);
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
    remove(@Param('id') id: string) {
        return this.procesionesService.remove(+id);
    }
}

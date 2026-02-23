import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { CiudadesService } from './ciudades.service';
import { CreateCiudadeDto } from './dto/create-ciudade.dto';
import { UpdateCiudadeDto } from './dto/update-ciudade.dto';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';

@Controller('ciudades')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN)
export class CiudadesController {
    constructor(private readonly ciudadesService: CiudadesService) {}

    @Post()
    create(@Body() createCiudadeDto: CreateCiudadeDto) {
        return this.ciudadesService.create(createCiudadeDto);
    }

    @Get()
    findAll() {
        return this.ciudadesService.findAll();
    }

    @Get('buscar')
    buscar(@Query('nombre') nombre: string) {
        return this.ciudadesService.buscarPorNombre(nombre);
    }

    @Get(':nombre/hermandades')
    getHermandades(@Param('nombre') nombreCiudad: string) {
        return this.ciudadesService.buscarHermandadesPorCiudad(nombreCiudad);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCiudadeDto: UpdateCiudadeDto,
    ) {
        return this.ciudadesService.update(id, updateCiudadeDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.ciudadesService.remove(id);
    }
}

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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CiudadesService } from './ciudades.service';
import { CreateCiudadeDto } from './dto/create-ciudade.dto';
import { UpdateCiudadeDto } from './dto/update-ciudade.dto';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';

@ApiTags('ciudades')
@ApiBearerAuth('access-token')
@Controller('ciudades')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN)
export class CiudadesController {
    constructor(private readonly ciudadesService: CiudadesService) {}

    @ApiOperation({ summary: 'Crear una nueva ciudad (solo administrador)' })
    @ApiResponse({ status: 201, description: 'Ciudad creada correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
    @Post()
    create(@Body() createCiudadeDto: CreateCiudadeDto) {
        return this.ciudadesService.create(createCiudadeDto);
    }

    @ApiOperation({ summary: 'Listar todas las ciudades (solo administrador)' })
    @ApiResponse({ status: 200, description: 'Lista de ciudades' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Get()
    findAll() {
        return this.ciudadesService.findAll();
    }

    @ApiOperation({ summary: 'Buscar ciudades por nombre' })
    @ApiResponse({ status: 200, description: 'Ciudades que coinciden con el nombre' })
    @Get('buscar')
    buscar(@Query('nombre') nombre: string) {
        return this.ciudadesService.buscarPorNombre(nombre);
    }

    @ApiOperation({ summary: 'Obtener hermandades de una ciudad por nombre' })
    @ApiResponse({ status: 200, description: 'Hermandades de la ciudad' })
    @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
    @Get(':nombre/hermandades')
    getHermandades(@Param('nombre') nombreCiudad: string) {
        return this.ciudadesService.buscarHermandadesPorCiudad(nombreCiudad);
    }

    @ApiOperation({ summary: 'Actualizar los datos de una ciudad' })
    @ApiResponse({ status: 200, description: 'Ciudad actualizada correctamente' })
    @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCiudadeDto: UpdateCiudadeDto,
    ) {
        return this.ciudadesService.update(id, updateCiudadeDto);
    }

    @ApiOperation({ summary: 'Eliminar una ciudad (solo administrador)' })
    @ApiResponse({ status: 200, description: 'Ciudad eliminada correctamente' })
    @ApiResponse({ status: 404, description: 'Ciudad no encontrada' })
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.ciudadesService.remove(id);
    }
}

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParticipacionesService } from './participaciones.service';
import { CreateParticipacionDto } from './dto/create-participacion.dto';
import { UpdateParticipacionDto } from './dto/update-participacion.dto';

@ApiTags('participaciones')
@Controller('participaciones')
export class ParticipacionesController {
    constructor(
        private readonly participacionesService: ParticipacionesService,
    ) {}

    @ApiOperation({ summary: 'Registrar una participación de banda en una procesión' })
    @ApiResponse({ status: 201, description: 'Participación creada correctamente' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    @Post()
    create(@Body() createParticipacioneDto: CreateParticipacionDto) {
        return this.participacionesService.create(createParticipacioneDto);
    }

    @ApiOperation({ summary: 'Listar todas las participaciones' })
    @ApiResponse({ status: 200, description: 'Lista de participaciones' })
    @Get()
    findAll() {
        return this.participacionesService.findAll();
    }

    @ApiOperation({ summary: 'Obtener una participación por ID' })
    @ApiResponse({ status: 200, description: 'Datos de la participación' })
    @ApiResponse({ status: 404, description: 'Participación no encontrada' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.participacionesService.findOne(+id);
    }

    @ApiOperation({ summary: 'Actualizar una participación' })
    @ApiResponse({ status: 200, description: 'Participación actualizada correctamente' })
    @ApiResponse({ status: 404, description: 'Participación no encontrada' })
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateParticipacioneDto: UpdateParticipacionDto,
    ) {
        return this.participacionesService.update(+id, updateParticipacioneDto);
    }

    @ApiOperation({ summary: 'Eliminar una participación' })
    @ApiResponse({ status: 200, description: 'Participación eliminada correctamente' })
    @ApiResponse({ status: 404, description: 'Participación no encontrada' })
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.participacionesService.remove(+id);
    }
}

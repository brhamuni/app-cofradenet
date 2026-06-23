import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventosService } from './eventos.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@ApiTags('eventos')
@Controller('eventos')
export class EventosController {
    constructor(private readonly eventosService: EventosService) {}

    @ApiOperation({ summary: 'Crear un nuevo evento de agenda para una banda' })
    @ApiResponse({ status: 201, description: 'Evento creado correctamente' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    @Post()
    create(@Body() createEventoDto: CreateEventoDto) {
        return this.eventosService.create(createEventoDto);
    }

    @ApiOperation({ summary: 'Listar todos los eventos' })
    @ApiResponse({ status: 200, description: 'Lista de eventos' })
    @Get()
    findAll() {
        return this.eventosService.findAll();
    }

    @ApiOperation({ summary: 'Obtener un evento por ID' })
    @ApiResponse({ status: 200, description: 'Datos del evento' })
    @ApiResponse({ status: 404, description: 'Evento no encontrado' })
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.eventosService.findOne(id);
    }

    @ApiOperation({ summary: 'Actualizar un evento' })
    @ApiResponse({
        status: 200,
        description: 'Evento actualizado correctamente',
    })
    @ApiResponse({ status: 404, description: 'Evento no encontrado' })
    @Patch('/:id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEventoDto: UpdateEventoDto,
    ) {
        return this.eventosService.update(id, updateEventoDto);
    }

    @ApiOperation({ summary: 'Eliminar un evento (administrador)' })
    @ApiResponse({ status: 200, description: 'Evento eliminado correctamente' })
    @ApiResponse({ status: 404, description: 'Evento no encontrado' })
    @Delete('admin/:id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.eventosService.remove(id);
    }
}

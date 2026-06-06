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
import { ItinerariosService } from './itinerarios.service';
import { CreateItinerarioDto } from './dto/create-itinerario.dto';
import { UpdateItinerarioDto } from './dto/update-itinerario.dto';

@ApiTags('itinerarios')
@Controller('itinerarios')
export class ItinerariosController {
    constructor(private readonly itinerariosService: ItinerariosService) {}

    @ApiOperation({ summary: 'Crear un itinerario para una procesión' })
    @ApiResponse({ status: 201, description: 'Itinerario creado correctamente' })
    @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
    @Post()
    create(@Body() createItinerarioDto: CreateItinerarioDto) {
        return this.itinerariosService.create(createItinerarioDto);
    }

    @ApiOperation({ summary: 'Listar todos los itinerarios' })
    @ApiResponse({ status: 200, description: 'Lista de itinerarios' })
    @Get()
    findAll() {
        return this.itinerariosService.findAll();
    }

    @ApiOperation({ summary: 'Obtener un itinerario por ID' })
    @ApiResponse({ status: 200, description: 'Datos del itinerario' })
    @ApiResponse({ status: 404, description: 'Itinerario no encontrado' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.itinerariosService.findOne(+id);
    }

    @ApiOperation({ summary: 'Actualizar un itinerario' })
    @ApiResponse({ status: 200, description: 'Itinerario actualizado correctamente' })
    @ApiResponse({ status: 404, description: 'Itinerario no encontrado' })
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateItinerarioDto: UpdateItinerarioDto,
    ) {
        return this.itinerariosService.update(+id, updateItinerarioDto);
    }

    @ApiOperation({ summary: 'Eliminar un itinerario' })
    @ApiResponse({ status: 200, description: 'Itinerario eliminado correctamente' })
    @ApiResponse({ status: 404, description: 'Itinerario no encontrado' })
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.itinerariosService.remove(+id);
    }
}

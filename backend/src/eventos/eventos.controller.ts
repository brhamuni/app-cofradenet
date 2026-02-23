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
import { EventosService } from './eventos.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Controller('eventos')
export class EventosController {
    constructor(private readonly eventosService: EventosService) {}

    @Post()
    create(@Body() createEventoDto: CreateEventoDto) {
        return this.eventosService.create(createEventoDto);
    }

    @Get()
    findAll() {
        return this.eventosService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.eventosService.findOne(id);
    }

    @Patch('/:id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEventoDto: UpdateEventoDto,
    ) {
        return this.eventosService.update(id, updateEventoDto);
    }

    @Delete('admin/:id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.eventosService.remove(id);
    }
}

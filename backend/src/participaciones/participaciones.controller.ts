import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from '@nestjs/common';
import { ParticipacionesService } from './participaciones.service';
import { CreateParticipacionDto } from './dto/create-participacion.dto';
import { UpdateParticipacionDto } from './dto/update-participacion.dto';

@Controller('participaciones')
export class ParticipacionesController {
    constructor(
        private readonly participacionesService: ParticipacionesService,
    ) {}

    @Post()
    create(@Body() createParticipacioneDto: CreateParticipacionDto) {
        return this.participacionesService.create(createParticipacioneDto);
    }

    @Get()
    findAll() {
        return this.participacionesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.participacionesService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateParticipacioneDto: UpdateParticipacionDto,
    ) {
        return this.participacionesService.update(+id, updateParticipacioneDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.participacionesService.remove(+id);
    }
}

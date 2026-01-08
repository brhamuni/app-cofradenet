import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { ProcesionesService } from './procesiones.service';
import { CreateProcesioneDto } from './dto/create-procesione.dto';
import { UpdateProcesioneDto } from './dto/update-procesione.dto';

@Controller('procesiones')
export class ProcesionesController {
    constructor(private readonly procesionesService: ProcesionesService) {}

    @Post()
    create(@Body() createProcesioneDto: CreateProcesioneDto) {
        return this.procesionesService.create(createProcesioneDto);
    }

    @Get()
    findAll() {
        return this.procesionesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.procesionesService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateProcesioneDto: UpdateProcesioneDto,
    ) {
        return this.procesionesService.update(+id, updateProcesioneDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.procesionesService.remove(+id);
    }
}

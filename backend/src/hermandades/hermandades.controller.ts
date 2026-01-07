import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
} from '@nestjs/common';
import { HermandadesService } from './hermandades.service';
import { CreateHermandadDto } from './dto/create-hermandad.dto';
import { UpdateHermandadDto } from './dto/update-hermandad.dto';

@Controller('hermandades')
export class HermandadesController {
    constructor(private readonly hermandadesService: HermandadesService) {}

    @Post()
    create(@Body() createHermandadeDto: CreateHermandadDto) {
        console.log('Creating hermandad with data:', createHermandadeDto);
        return this.hermandadesService.create(createHermandadeDto);
    }

    @Get()
    findAll() {
        return this.hermandadesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.hermandadesService.findOne(+id);
    }

    @Patch(':id')
    update(
        @Param('id') id: number,
        @Body() updateHermandadeDto: UpdateHermandadDto,
    ) {
        return this.hermandadesService.update(id, updateHermandadeDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.hermandadesService.remove(+id);
    }
}

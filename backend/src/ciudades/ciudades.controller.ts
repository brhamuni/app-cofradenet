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
import { CiudadesService } from './ciudades.service';
import { CreateCiudadeDto } from './dto/create-ciudade.dto';
import { UpdateCiudadeDto } from './dto/update-ciudade.dto';

@Controller('ciudades')
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
        @Param('id') id: string,
        @Body() updateCiudadeDto: UpdateCiudadeDto,
    ) {
        return this.ciudadesService.update(+id, updateCiudadeDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.ciudadesService.remove(+id);
    }
}

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { HermandadesService } from './hermandades.service';
import { CreateHermandadDto } from './dto/create-hermandad.dto';
import { UpdateHermandadDto } from './dto/update-hermandad.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';

@Controller('hermandades')
@UseGuards(JwtAuthGuard, RolesGuard)
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

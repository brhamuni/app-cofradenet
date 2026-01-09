import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Req,
    ParseIntPipe,
} from '@nestjs/common';
import { HermandadesService } from './hermandades.service';
import { CreateHermandadDto } from './dto/create-hermandad.dto';
import { UpdateHermandadDto } from './dto/update-hermandad.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';

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
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateHermandadDto,
        @Req() req,
    ) {
        return this.hermandadesService.updatePerfil(id, updateDto, req.user);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.hermandadesService.remove(+id);
    }
}

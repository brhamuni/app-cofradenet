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

    @Patch('perfil')
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD) // Tu Guard verifica que el usuario tenga este rol
    updateMyHermandad(@Req() req, @Body() updateDto: UpdateHermandadDto) {
        return this.hermandadesService.updatePerfil(req.user.id, updateDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.hermandadesService.remove(+id);
    }
}

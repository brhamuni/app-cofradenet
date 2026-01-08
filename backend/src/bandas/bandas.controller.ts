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
import { BandasService } from './bandas.service';
import { CreateBandaDto } from './dto/create-banda.dto';
import { UpdateBandaDto } from './dto/update-banda.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';

@Controller('bandas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BandasController {
    constructor(private readonly bandasService: BandasService) {}

    @Post()
    create(@Body() createBandaDto: CreateBandaDto) {
        return this.bandasService.create(createBandaDto);
    }

    @Get()
    findAll() {
        return this.bandasService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bandasService.findOne(+id);
    }

    @Patch(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
    update(@Param('id') id: string, @Body() updateBandaDto: UpdateBandaDto) {
        return this.bandasService.update(+id, updateBandaDto);
    }

    @Delete(':id')
    @Roles(RolUsuario.ADMIN, RolUsuario.BANDA)
    remove(@Param('id') id: string) {
        return this.bandasService.remove(+id);
    }
}

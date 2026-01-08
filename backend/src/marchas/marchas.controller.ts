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
    Query,
    NotFoundException,
} from '@nestjs/common';
import { MarchasService } from './marchas.service';
import { CreateMarchaDto } from './dto/create-marcha.dto';
import { UpdateMarchaDto } from './dto/update-marcha.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { RolUsuario, Usuario } from '@backend/usuarios/entities/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller('marchas')
export class MarchasController {
    constructor(private readonly marchasService: MarchasService) {}

    @Get('search')
    buscarLocal(@Query('query') query: string) {
        if (!query) return { enMiCatalogo: [], nuevasSugerencias: [] };

        return this.marchasService.buscadorInteligente(query);
    }

    @Post('repertorio')
    @Roles(RolUsuario.BANDA)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async addRepertorio(@Body() dto: CreateMarchaDto, @Req() req) {
        dto.tipoGuardado = 'repertorio';
        return this.marchasService.create(dto, req.user.id);
    }

    @Post('favoritas')
    @Roles(RolUsuario.COFRADE)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async addFavorita(@Body() dto: CreateMarchaDto, @Req() req) {
        dto.tipoGuardado = 'favorita';
        return this.marchasService.create(dto, req.user.id);
    }

    @Get()
    findAll() {
        return this.marchasService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.marchasService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateMarchaDto: UpdateMarchaDto) {
        return this.marchasService.update(+id, updateMarchaDto);
    }

    @Delete('repertorio/:id')
    @Roles(RolUsuario.BANDA)
    @UseGuards(JwtAuthGuard, RolesGuard)
    removeRepertorio(@Param('id') id: string, @Req() req) {
        return this.marchasService.remove(+req.user.id, +id, 'repertorio');
    }

    @Delete('favoritas/:id')
    @Roles(RolUsuario.COFRADE)
    @UseGuards(JwtAuthGuard, RolesGuard)
    removeFavorita(@Param('id') id: string, @Req() req) {
        return this.marchasService.remove(+req.user.id, +id, 'favorita');
    }

    @Get('repertorio-banda/:id')
    getRepertorio(@Param('id') id: string) {
        return this.marchasService.obtenerRepertorioBanda(+id);
    }
}

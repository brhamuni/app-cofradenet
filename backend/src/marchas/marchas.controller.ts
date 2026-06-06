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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MarchasService } from './marchas.service';
import { CreateMarchaDto } from './dto/create-marcha.dto';
import { UpdateMarchaDto } from './dto/update-marcha.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { RolUsuario, Usuario } from '@backend/usuarios/entities/usuario.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@ApiTags('marchas')
@Controller('marchas')
export class MarchasController {
    constructor(private readonly marchasService: MarchasService) {}

    @ApiOperation({ summary: 'Buscar marchas en el catálogo local y sugerencias externas' })
    @ApiResponse({ status: 200, description: 'Resultados de la búsqueda inteligente de marchas' })
    @Get('search')
    buscarLocal(@Query('query') query: string) {
        if (!query) return { enMiCatalogo: [], nuevasSugerencias: [] };

        return this.marchasService.buscadorInteligente(query);
    }

    @ApiOperation({ summary: 'Añadir una marcha al repertorio de una banda' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Marcha añadida al repertorio correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Solo las bandas pueden gestionar su repertorio' })
    @Post('repertorio')
    @Roles(RolUsuario.BANDA)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async addRepertorio(@Body() dto: CreateMarchaDto, @Req() req) {
        dto.tipoGuardado = 'repertorio';
        return this.marchasService.create(dto, req.user.id);
    }

    @ApiOperation({ summary: 'Añadir una marcha a favoritas del usuario' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Marcha añadida a favoritas correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Solo los cofrades pueden gestionar sus favoritas' })
    @Post('favoritas')
    @Roles(RolUsuario.COFRADE)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async addFavorita(@Body() dto: CreateMarchaDto, @Req() req) {
        dto.tipoGuardado = 'favorita';
        return this.marchasService.create(dto, req.user.id);
    }

    @ApiOperation({ summary: 'Listar todas las marchas' })
    @ApiResponse({ status: 200, description: 'Lista de marchas' })
    @Get()
    findAll() {
        return this.marchasService.findAll();
    }

    @ApiOperation({ summary: 'Obtener una marcha por ID' })
    @ApiResponse({ status: 200, description: 'Datos de la marcha' })
    @ApiResponse({ status: 404, description: 'Marcha no encontrada' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.marchasService.findOne(+id);
    }

    @ApiOperation({ summary: 'Actualizar los datos de una marcha' })
    @ApiResponse({ status: 200, description: 'Marcha actualizada correctamente' })
    @ApiResponse({ status: 404, description: 'Marcha no encontrada' })
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateMarchaDto: UpdateMarchaDto) {
        return this.marchasService.update(+id, updateMarchaDto);
    }

    @ApiOperation({ summary: 'Eliminar una marcha del repertorio de una banda' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Marcha eliminada del repertorio correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Solo las bandas pueden gestionar su repertorio' })
    @Delete('repertorio/:id')
    @Roles(RolUsuario.BANDA)
    @UseGuards(JwtAuthGuard, RolesGuard)
    removeRepertorio(@Param('id') id: string, @Req() req) {
        return this.marchasService.remove(+req.user.id, +id, 'repertorio');
    }

    @ApiOperation({ summary: 'Eliminar una marcha de las favoritas del usuario' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Marcha eliminada de favoritas correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Solo los cofrades pueden gestionar sus favoritas' })
    @Delete('favoritas/:id')
    @Roles(RolUsuario.COFRADE)
    @UseGuards(JwtAuthGuard, RolesGuard)
    removeFavorita(@Param('id') id: string, @Req() req) {
        return this.marchasService.remove(+req.user.id, +id, 'favorita');
    }

    @ApiOperation({ summary: 'Obtener el repertorio completo de una banda' })
    @ApiResponse({ status: 200, description: 'Lista de marchas del repertorio de la banda' })
    @ApiResponse({ status: 404, description: 'Banda no encontrada' })
    @Get('repertorio-banda/:id')
    getRepertorio(@Param('id') id: string) {
        return this.marchasService.obtenerRepertorioBanda(+id);
    }
}

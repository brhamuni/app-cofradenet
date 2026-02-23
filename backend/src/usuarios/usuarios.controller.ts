import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    ParseIntPipe,
    Req,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from './entities/usuario.entity';
import { NotBlockedGuard } from '@backend/auth/guards/not-blocked.guard';

@Controller('usuarios')
@UseGuards(NotBlockedGuard)
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @Post()
    create(@Body() createUsuarioDto: CreateUsuarioDto) {
        return this.usuariosService.create(createUsuarioDto);
    }

    @Get('lista-completa')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN)
    findAll() {
        return this.usuariosService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.usuariosService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(
        @Param('id') id: number,
        @Body() updateUsuarioDto: UpdateUsuarioDto,
    ) {
        return this.usuariosService.update(id, updateUsuarioDto);
    }

    @Get('perfil')
    obtenerPerfil(@Req() req) {
        return this.usuariosService.getPerfil(req.user.id);
    }

    @Post('favoritos/hermandad/:id')
    toggleHermandad(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.usuariosService.toggleFavoritoHermandad(req.user.id, id);
    }

    @Post('favoritos/banda/:id')
    @UseGuards(JwtAuthGuard)
    toggleBanda(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.usuariosService.toggleFavoritoBanda(req.user.id, id);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.usuariosService.remove(id);
    }

    @Patch(':id/rol')
    @Roles(RolUsuario.ADMIN) // Solo el jefe puede ascender/degradar usuarios
    cambiarRol(
        @Param('id', ParseIntPipe) id: number,
        @Body('nuevoRol') nuevoRol: RolUsuario,
    ) {
        return this.usuariosService.updateRol(id, nuevoRol);
    }
}

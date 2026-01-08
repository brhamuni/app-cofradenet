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
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from './entities/usuario.entity';
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) {}

    @Post()
    create(@Body() createUsuarioDto: CreateUsuarioDto) {
        return this.usuariosService.create(createUsuarioDto);
    }

    @Get('lista-completa')
    @Roles(RolUsuario.ADMIN)
    findAll() {
        return this.usuariosService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.usuariosService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: number,
        @Body() updateUsuarioDto: UpdateUsuarioDto,
    ) {
        return this.usuariosService.update(id, updateUsuarioDto);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.usuariosService.remove(id);
    }
}

import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('usuarios')
    async listarUsuarios() {
        return await this.adminService.findAllUsers();
    }

    @Patch('verificar/:id')
    async verificarUsuario(@Param('id') id: number) {
        return await this.adminService.verificarUsuario(id);
    }
}

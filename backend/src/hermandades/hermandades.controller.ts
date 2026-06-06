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
    UseInterceptors,
    BadRequestException,
    UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { HermandadesService } from './hermandades.service';
import { CreateHermandadDto } from './dto/create-hermandad.dto';
import { UpdateHermandadDto } from './dto/update-hermandad.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';
import { RolesGuard } from '@backend/auth/guards/roles.guard';
import { Roles } from '@backend/auth/decorators/roles.decorator';
import { RolUsuario } from '@backend/usuarios/entities/usuario.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { NotBlockedGuard } from '@backend/auth/guards/not-blocked.guard';

@ApiTags('hermandades')
@Controller('hermandades')
// ❌ HEMOS QUITADO EL GUARD GLOBAL DE AQUÍ
export class HermandadesController {
    constructor(private readonly hermandadesService: HermandadesService) {}

    // ==========================================
    // RUTAS PÚBLICAS (Cualquiera puede verlas)
    // ==========================================

    @ApiOperation({ summary: 'Listar todas las hermandades' })
    @ApiResponse({ status: 200, description: 'Lista de hermandades' })
    @Get()
    findAll() {
        return this.hermandadesService.findAll();
    }

    @ApiOperation({ summary: 'Obtener una hermandad por ID' })
    @ApiResponse({ status: 200, description: 'Datos de la hermandad' })
    @ApiResponse({ status: 404, description: 'Hermandad no encontrada' })
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.hermandadesService.findOne(id);
    }

    // ==========================================
    // RUTAS PRIVADAS (Requieren login/token)
    // ==========================================

    @ApiOperation({ summary: 'Crear una nueva hermandad' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 201, description: 'Hermandad creada correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard) // ✅ Añadido aquí
    create(@Body() createHermandadeDto: CreateHermandadDto) {
        console.log('Creating hermandad with data:', createHermandadeDto);
        return this.hermandadesService.create(createHermandadeDto);
    }

    @ApiOperation({ summary: 'Actualizar el perfil de una hermandad' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Hermandad actualizada correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
    @ApiResponse({ status: 404, description: 'Hermandad no encontrada' })
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard) // ✅ Actualizado
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateHermandadDto,
        @Req() req,
    ) {
        return this.hermandadesService.updatePerfil(id, updateDto, req.user);
    }

    @ApiOperation({ summary: 'Eliminar una hermandad (solo administrador)' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Hermandad eliminada correctamente' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard) // ✅ Añadido aquí
    @Roles(RolUsuario.ADMIN) // Opcional: Solo un admin debería poder borrar una hermandad
    remove(@Param('id') id: string) {
        return this.hermandadesService.remove(+id);
    }

    @ApiOperation({ summary: 'Subir el logo de una hermandad' })
    @ApiBearerAuth('access-token')
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: 'Logo actualizado correctamente' })
    @ApiResponse({ status: 400, description: 'No se proporcionó ningún archivo válido' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @Post(':id/logo')
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard) // ✅ Actualizado
    @Roles(RolUsuario.ADMIN, RolUsuario.HERMANDAD)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `hermandad-${uniqueSuffix}${ext}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                    return cb(
                        new BadRequestException('Solo se permiten imágenes'),
                        false,
                    );
                }
                cb(null, true);
            },
        }),
    )
    uploadLogo(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file)
            throw new BadRequestException('No se ha subido ningún archivo');

        return this.hermandadesService.updateLogo(
            id,
            `uploads/${file.filename}`,
        );
    }

    @ApiOperation({ summary: 'Verificar o desverificar una hermandad (solo administrador)' })
    @ApiBearerAuth('access-token')
    @ApiResponse({ status: 200, description: 'Estado de verificación actualizado' })
    @ApiResponse({ status: 401, description: 'No autenticado' })
    @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
    @Patch(':id/verificar')
    @UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard) // ✅ Actualizado
    @Roles(RolUsuario.ADMIN)
    verificar(
        @Param('id', ParseIntPipe) id: number,
        @Body('verificada') verificada: boolean,
    ) {
        return this.hermandadesService.verificar(id, verificada);
    }
}
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

@Controller('hermandades')
@UseGuards(JwtAuthGuard, RolesGuard, NotBlockedGuard)
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

    @Post(':id/logo')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads', // Carpeta donde se guardan
                filename: (req, file, cb) => {
                    // Generamos un nombre único: timestamp + extensión original
                    const uniqueSuffix =
                        Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = extname(file.originalname);
                    cb(null, `hermandad-${uniqueSuffix}${ext}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                // Validamos que sea una imagen
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

        // Llamamos al servicio para que guarde la RUTA en la base de datos
        // La ruta que guardamos es relativa: 'uploads/nombre-archivo.jpg'
        return this.hermandadesService.updateLogo(
            id,
            `uploads/${file.filename}`,
        );
    }

    @Patch(':id/verificar')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolUsuario.ADMIN)
    verificar(
        @Param('id', ParseIntPipe) id: number,
        @Body('verificada') verificada: boolean,
    ) {
        return this.hermandadesService.verificar(id, verificada);
    }
}

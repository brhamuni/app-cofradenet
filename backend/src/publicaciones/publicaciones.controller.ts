import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { PublicacionesService } from './publicaciones.service';
import { CreatePublicacionDto } from './dto/create-publicacion.dto';
import { JwtAuthGuard } from '@backend/auth/jwt-auth.guard';

@Controller('publicaciones')
export class PublicacionesController {
    constructor(private readonly service: PublicacionesService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() dto: CreatePublicacionDto, @Req() req: any) {
        return this.service.create(dto, req.user);
    }

    @Get('hermandad/:id')
    findByHermandad(@Param('id', ParseIntPipe) id: number) {
        return this.service.findByHermandad(id);
    }

    @Get('banda/:id')
    findByBanda(@Param('id', ParseIntPipe) id: number) {
        return this.service.findByBanda(id);
    }

    @Get('usuario/:id')
    findByUsuario(@Param('id', ParseIntPipe) id: number) {
        return this.service.findByUsuario(id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.service.remove(id, req.user);
    }
}

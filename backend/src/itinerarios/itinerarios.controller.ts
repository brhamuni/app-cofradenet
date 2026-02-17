import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ItinerariosService } from './itinerarios.service';
import { CreateItinerarioDto } from './dto/create-itinerario.dto';
import { UpdateItinerarioDto } from './dto/update-itinerario.dto';

@Controller('itinerarios')
export class ItinerariosController {
  constructor(private readonly itinerariosService: ItinerariosService) {}

  @Post()
  create(@Body() createItinerarioDto: CreateItinerarioDto) {
    return this.itinerariosService.create(createItinerarioDto);
  }

  @Get()
  findAll() {
    return this.itinerariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itinerariosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateItinerarioDto: UpdateItinerarioDto) {
    return this.itinerariosService.update(+id, updateItinerarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.itinerariosService.remove(+id);
  }
}

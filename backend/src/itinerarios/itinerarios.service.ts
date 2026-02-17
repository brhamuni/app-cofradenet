import { Injectable } from '@nestjs/common';
import { CreateItinerarioDto } from './dto/create-itinerario.dto';
import { UpdateItinerarioDto } from './dto/update-itinerario.dto';

@Injectable()
export class ItinerariosService {
  create(createItinerarioDto: CreateItinerarioDto) {
    return 'This action adds a new itinerario';
  }

  findAll() {
    return `This action returns all itinerarios`;
  }

  findOne(id: number) {
    return `This action returns a #${id} itinerario`;
  }

  update(id: number, updateItinerarioDto: UpdateItinerarioDto) {
    return `This action updates a #${id} itinerario`;
  }

  remove(id: number) {
    return `This action removes a #${id} itinerario`;
  }
}

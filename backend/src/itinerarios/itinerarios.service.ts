import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateItinerarioDto } from './dto/create-itinerario.dto';
import { UpdateItinerarioDto } from './dto/update-itinerario.dto';
import { Itinerario } from './entities/itinerario.entity'; // Asegúrate de que la ruta es correcta

@Injectable()
export class ItinerariosService {
    // Inyectamos el repositorio de la base de datos
    constructor(
        @InjectRepository(Itinerario)
        private readonly itinerarioRepository: Repository<Itinerario>,
    ) {}

    async create(createItinerarioDto: CreateItinerarioDto) {
        const nuevoItinerario =
            this.itinerarioRepository.create(createItinerarioDto);
        return await this.itinerarioRepository.save(nuevoItinerario);
    }

    findAll() {
        return this.itinerarioRepository.find();
    }

    findOne(id: number) {
        return this.itinerarioRepository.findOne({ where: { id } });
    }

    update(id: number, updateItinerarioDto: UpdateItinerarioDto) {
        return `This action updates a #${id} itinerario`; // Lo dejamos para otro día
    }

    remove(id: number) {
        return `This action removes a #${id} itinerario`; // Lo dejamos para otro día
    }
}

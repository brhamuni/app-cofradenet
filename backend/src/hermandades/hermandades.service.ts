import { Injectable } from '@nestjs/common';
import { CreateHermandadDto } from './dto/create-hermandad.dto';
import { UpdateHermandadDto } from './dto/update-hermandad.dto';

@Injectable()
export class HermandadesService {
    create(createHermandadeDto: CreateHermandadDto) {
        return 'This action adds a new hermandade';
    }

    findAll() {
        return `This action returns all hermandades`;
    }

    findOne(id: number) {
        return `This action returns a #${id} hermandade`;
    }

    update(id: number, updateHermandadeDto: UpdateHermandadDto) {
        return `This action updates a #${id} hermandade`;
    }

    remove(id: number) {
        return `This action removes a #${id} hermandade`;
    }
}

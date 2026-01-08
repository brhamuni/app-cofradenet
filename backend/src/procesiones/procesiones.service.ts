import { Injectable } from '@nestjs/common';
import { CreateProcesioneDto } from './dto/create-procesione.dto';
import { UpdateProcesioneDto } from './dto/update-procesione.dto';

@Injectable()
export class ProcesionesService {
    create(createProcesioneDto: CreateProcesioneDto) {
        return 'This action adds a new procesione';
    }

    findAll() {
        return `This action returns all procesiones`;
    }

    findOne(id: number) {
        return `This action returns a #${id} procesione`;
    }

    update(id: number, updateProcesioneDto: UpdateProcesioneDto) {
        return `This action updates a #${id} procesione`;
    }

    remove(id: number) {
        return `This action removes a #${id} procesione`;
    }
}

import { Injectable } from '@nestjs/common';
import { CreateBandaDto } from './dto/create-banda.dto';
import { UpdateBandaDto } from './dto/update-banda.dto';

@Injectable()
export class BandasService {
    create(createBandaDto: CreateBandaDto) {
        return 'This action adds a new banda';
    }

    findAll() {
        return `This action returns all bandas`;
    }

    findOne(id: number) {
        return `This action returns a #${id} banda`;
    }

    update(id: number, updateBandaDto: UpdateBandaDto) {
        return `This action updates a #${id} banda`;
    }

    remove(id: number) {
        return `This action removes a #${id} banda`;
    }
}

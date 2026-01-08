import { Test, TestingModule } from '@nestjs/testing';
import { ProcesionesController } from './procesiones.controller';
import { ProcesionesService } from './procesiones.service';

describe('ProcesionesController', () => {
    let controller: ProcesionesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProcesionesController],
            providers: [ProcesionesService],
        }).compile();

        controller = module.get<ProcesionesController>(ProcesionesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { HermandadesController } from './hermandades.controller';
import { HermandadesService } from './hermandades.service';

describe('HermandadesController', () => {
    let controller: HermandadesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HermandadesController],
            providers: [HermandadesService],
        }).compile();

        controller = module.get<HermandadesController>(HermandadesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});

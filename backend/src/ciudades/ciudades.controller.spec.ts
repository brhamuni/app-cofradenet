import { Test, TestingModule } from '@nestjs/testing';
import { CiudadesController } from './ciudades.controller';
import { CiudadesService } from './ciudades.service';

describe('CiudadesController', () => {
    let controller: CiudadesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CiudadesController],
            providers: [CiudadesService],
        }).compile();

        controller = module.get<CiudadesController>(CiudadesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});

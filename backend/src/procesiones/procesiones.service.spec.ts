import { Test, TestingModule } from '@nestjs/testing';
import { ProcesionesService } from './procesiones.service';

describe('ProcesionesService', () => {
    let service: ProcesionesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ProcesionesService],
        }).compile();

        service = module.get<ProcesionesService>(ProcesionesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});

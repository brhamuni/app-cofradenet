import { Test, TestingModule } from '@nestjs/testing';
import { CiudadesService } from './ciudades.service';

describe('CiudadesService', () => {
    let service: CiudadesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CiudadesService],
        }).compile();

        service = module.get<CiudadesService>(CiudadesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});

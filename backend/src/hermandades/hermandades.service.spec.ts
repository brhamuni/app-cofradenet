import { Test, TestingModule } from '@nestjs/testing';
import { HermandadesService } from './hermandades.service';

describe('HermandadesService', () => {
    let service: HermandadesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [HermandadesService],
        }).compile();

        service = module.get<HermandadesService>(HermandadesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});

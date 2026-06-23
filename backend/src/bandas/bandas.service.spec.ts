import { Test, TestingModule } from '@nestjs/testing';
import { BandasService } from './bandas.service';

describe('BandasService', () => {
    let service: BandasService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [BandasService],
        }).compile();

        service = module.get<BandasService>(BandasService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});

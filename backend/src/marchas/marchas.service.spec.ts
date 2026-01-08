import { Test, TestingModule } from '@nestjs/testing';
import { MarchasService } from './marchas.service';

describe('MarchasService', () => {
    let service: MarchasService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [MarchasService],
        }).compile();

        service = module.get<MarchasService>(MarchasService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});

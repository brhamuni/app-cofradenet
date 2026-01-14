import { Test, TestingModule } from '@nestjs/testing';
import { ParticipacionesService } from './participaciones.service';

describe('ParticipacionesService', () => {
    let service: ParticipacionesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ParticipacionesService],
        }).compile();

        service = module.get<ParticipacionesService>(ParticipacionesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});

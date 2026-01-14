import { Test, TestingModule } from '@nestjs/testing';
import { ParticipacionesController } from './participaciones.controller';
import { ParticipacionesService } from './participaciones.service';

describe('ParticipacionesController', () => {
    let controller: ParticipacionesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ParticipacionesController],
            providers: [ParticipacionesService],
        }).compile();

        controller = module.get<ParticipacionesController>(
            ParticipacionesController,
        );
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});

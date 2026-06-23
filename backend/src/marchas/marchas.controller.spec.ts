import { Test, TestingModule } from '@nestjs/testing';
import { MarchasController } from './marchas.controller';
import { MarchasService } from './marchas.service';

describe('MarchasController', () => {
    let controller: MarchasController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MarchasController],
            providers: [MarchasService],
        }).compile();

        controller = module.get<MarchasController>(MarchasController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});

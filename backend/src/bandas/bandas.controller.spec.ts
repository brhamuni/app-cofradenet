import { Test, TestingModule } from '@nestjs/testing';
import { BandasController } from './bandas.controller';
import { BandasService } from './bandas.service';

describe('BandasController', () => {
    let controller: BandasController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BandasController],
            providers: [BandasService],
        }).compile();

        controller = module.get<BandasController>(BandasController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ItinerariosController } from './itinerarios.controller';
import { ItinerariosService } from './itinerarios.service';

describe('ItinerariosController', () => {
  let controller: ItinerariosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItinerariosController],
      providers: [ItinerariosService],
    }).compile();

    controller = module.get<ItinerariosController>(ItinerariosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

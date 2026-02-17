import { Test, TestingModule } from '@nestjs/testing';
import { ItinerariosService } from './itinerarios.service';

describe('ItinerariosService', () => {
  let service: ItinerariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ItinerariosService],
    }).compile();

    service = module.get<ItinerariosService>(ItinerariosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

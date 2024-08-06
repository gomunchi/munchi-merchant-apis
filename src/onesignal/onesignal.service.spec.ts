import { Test, TestingModule } from '@nestjs/testing';
import { OnesignalService } from './onesignal.service';

describe('OnesignalService', () => {
  let service: OnesignalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnesignalService],
    }).compile();

    service = module.get<OnesignalService>(OnesignalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

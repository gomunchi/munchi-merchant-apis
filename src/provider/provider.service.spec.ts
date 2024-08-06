import { Test, TestingModule } from '@nestjs/testing';

import { OrderingService } from './ordering/ordering.service';

describe('ProviderService', () => {
  let orderingService: OrderingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderingService],
    }).compile();

    orderingService = module.get<OrderingService>(OrderingService);
  });

  it('should be defined', () => {
    expect(orderingService).toBeDefined();
  });
});

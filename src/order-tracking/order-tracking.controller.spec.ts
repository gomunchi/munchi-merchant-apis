import { Test, TestingModule } from '@nestjs/testing';
import { OrderTrackingController } from './order-tracking.controller';

describe('OrderTrackingController', () => {
  let controller: OrderTrackingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderTrackingController],
    }).compile();

    controller = module.get<OrderTrackingController>(OrderTrackingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

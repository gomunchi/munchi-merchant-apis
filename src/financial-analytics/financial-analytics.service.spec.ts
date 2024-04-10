import { Test, TestingModule } from '@nestjs/testing';
import { FinancialAnalyticsService } from './financial-analytics.service';

describe('FinancialAnalyticsService', () => {
  let service: FinancialAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FinancialAnalyticsService],
    }).compile();

    service = module.get<FinancialAnalyticsService>(FinancialAnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

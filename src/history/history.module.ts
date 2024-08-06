import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';

@Module({
  providers: [HistoryService],
  controllers: [HistoryController],
})
export class HistoryModule {}

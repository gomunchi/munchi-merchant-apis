import { Controller, Get, Query, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { HistoryService } from './history.service';
import { HistoryFilterQuery, HistoryQuery } from './dto/history,dto';

@UseGuards(JwtGuard)
@Controller('history')
export class HistoryController {
  constructor(private historyService: HistoryService) {}
  @Get('orders')
  getOrderHistory(
    @Query(new ValidationPipe()) dateQuery: HistoryQuery,
    @Query(new ValidationPipe()) filterQuery: HistoryFilterQuery,
    @Request() request: any,
  ) {
    const { sessionPublicId } = request.user;
    return this.historyService.getOrderHistory(sessionPublicId, dateQuery, filterQuery);
  }

  @Get('product')
  getProductHistory(@Query(new ValidationPipe()) dateQuery: HistoryQuery, @Request() request: any) {
    const { sessionPublicId } = request.user;
    return this.historyService.getProductHistory(sessionPublicId, dateQuery);
  }
}
